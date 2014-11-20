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
  this._emitted = []
  this._done = false
  this._session = null
  this._server = null
  this._runCallback = null
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
    self._session = session
    var exitcode = 0
    var skipped = 0
    var lastConsoleLogs = []
    var lastAssertions = []

    // Timeout for the entire test suite
    self._timeoutInterval = setTimeout(function () {
      self.write({ type: 'timeout', message: 'Tests have timed out after ' + self.timeout + 'ms' })
      self._server.deleteSession(session.sessionId).then(function() {
        self._done = true
        done(1)
      })
    }, self.timeout)

    function pollForResult() {
      return session.getLogsFor('browser').then(function(logs) {
        lastConsoleLogs.push(logs.map(function(log) {
          return log.message;
        }).join('\n'))
        return session.execute('return ' + self.varName).then(function(results) {
          if (!Array.isArray(results)) results = [results]
          for (var i = 0; i < results.length; i++) {
            if (results[i]) self.write(results[i])
          }
        })
      }).finally(function() {
        process.nextTick(pollForResult)
      })
    }
    session.get(self.url).then(pollForResult)
  })

  return self
}

Lightfoot.prototype.quit = function(done) {
  var self = this
  if (self._server && self._session) {
    self._server.deleteSession(self._session.sessionId).then(done)
  } else {
    done()
  }
  return self
}

Lightfoot.prototype._transform = function(chunk, encoding, done) {
  var self = this

  chunk = chunk || {}
  chunk.type = chunk.type || 'log'
  chunk.id = chunk.id || chunk.type + Date.now()

  // Avoid processing duplicate chunk.id
  if (self._done || self._emitted.indexOf(chunk.id) !== -1) return done()
  self._emitted.push(chunk.id)

  if (chunk.type === 'done') {
    process.nextTick(function() {
      self.push(chunk)
      if (chunk.failed > 0) {
        self._runCallback(1)
      } else {
        self._runCallback(0)
      }
      clearTimeout(self._timeoutInterval)
      self._runCallback = null
      self._done = true
      done()
    })
  } else {
    self.push(chunk)
    done()
  }
}
