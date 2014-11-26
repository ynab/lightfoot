var Transform = require('stream').Transform
var inherits = require('util').inherits
var Server = require('leadfoot/Server')

function Lightfoot(cfg) {
  if (!(this instanceof Lightfoot)) return new Lightfoot(cfg)
  cfg = cfg || {};
  cfg.objectMode = true
  Transform.call(this, cfg)
  if (!cfg.url) {
    throw new Error('Please supply a `url` of the address where your tests reside.')
  }
  this.url = cfg.url
  this.seleniumUrl = cfg.seleniumUrl || 'http://localhost:4444/wd/hub'
  this.browserName = cfg.browserName || 'chrome'
  this.varName = cfg.varName || 'window.NOTIFY_LIGHTFOOT'
  this.timeout = cfg.timeout || 20 * 60 * 1000
  this.session = null
  this._done = false
  this._server = null
  this._runCallback = null
  this._pointer = 0
}
module.exports = Lightfoot
inherits(Lightfoot, Transform)

Lightfoot.prototype.run = function(done) {
  var self = this

  self._done = false
  self._runCallback = done

  self._server = new Server(self.seleniumUrl)
  self._server.createSession({
    browserName: self.browserName,
    loggingPrefs: { browser: 'ALL' },
  }).then(function(session) {
    self.session = session
    self.sessionId = session.sessionId
    var lastConsoleLogs = []

    // Timeout for the entire test suite
    self._timeoutInterval = setTimeout(function () {
      self.write({ type: 'timeout', message: 'Tests have timed out after ' + self.timeout + 'ms' })
      self.quit(function() {
        if (typeof done === 'function') done(1)
      })
    }, self.timeout)

    function pollForResult() {
      return session.getLogsFor('browser').then(function(logs) {
        lastConsoleLogs.push(logs.map(function(log) {
          return log.message;
        }).join('\n'))
        return session.execute('return ' + self.varName).then(function(results) {
          if (!Array.isArray(results)) results = [results]
          for (var i = self._pointer; i < results.length; i++) {
            if (results[i]) self.write(results[i])
          }
          self._pointer = results.length
        })
      }).finally(function() {
        if (!self._done) process.nextTick(pollForResult)
      })
    }
    session.get(self.url).then(pollForResult)
  })
  .catch(function(err) {
    self.write({ type: 'error', error: err })
  })

  return self
}

Lightfoot.prototype.quit = function(done) {
  var self = this
  function cb() {
    clearTimeout(self._timeoutInterval)
    self._runCallback = null
    self._done = true
    self.end()
    if (typeof done === 'function') done()
  }
  if (self._server && self.session) {
    self._server.deleteSession(self.sessionId).then(cb)
  } else {
    cb()
  }
  return self
}

Lightfoot.prototype._transform = function(chunk, encoding, done) {
  var self = this

  if (self._done) return done()

  chunk = chunk || {}
  chunk.type = chunk.type || 'log'

  if (chunk.type === 'done') {
    process.nextTick(function() {
      self.push(chunk)
      if (chunk.failed > 0) {
        if (typeof self._runCallback === 'function') self._runCallback(1)
      } else {
        if (typeof self._runCallback === 'function') self._runCallback(0)
      }
    })
  } else {
    self.push(chunk)
    done()
  }
}
