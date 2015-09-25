var Transform = require('stream').Transform
var inherits = require('util').inherits
var Server = require('leadfoot/Server')
var xtend = require('xtend')
var mergeStream = require('merge-stream')

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

  this._cfg = xtend({
    browserName: 'chrome',
    loggingPrefs: { browser: 'ALL' },
    varName: 'window.NOTIFY_LIGHTFOOT',
    timeout: 20 * 60 * 1000,
  }, cfg)

  this.browserName = this._cfg.browserName
  this.varName = this._cfg.varName
  this.timeout = this._cfg.timeout
  this.pollInterval = this._cfg.pollInterval
  this.session = null
  this._done = false
  this._server = null
  this._runCallback = null
  this._pointer = 0
}
module.exports = Lightfoot
module.exports.runAll = require('./lib/runAll.js')
inherits(Lightfoot, Transform)

Lightfoot.prototype.run = function(done) {
  var self = this

  self._done = false
  self._runCallback = done

  self._server = new Server(self.seleniumUrl)
  self._server.createSession(this._cfg).then(function(session) {
    self.session = session
    self.sessionId = session.sessionId

    // Timeout for the entire test suite
    self._timeoutInterval = setTimeout(function () {
      self._writePayload({ type: 'timeout', message: 'Tests have timed out after ' + self.timeout + 'ms' })
      self.quit(function() {
        if (typeof done === 'function') done(1)
      })
    }, self.timeout)

    function pollForResult() {
      return session.getLogsFor('browser').then(function(logs) {
        logs.forEach(function(log) {
          log.type = 'log'
          self._writePayload(log)
        })
        return session.execute('return ' + self.varName).then(function(results) {
          if (!Array.isArray(results)) results = [results]
          for (var i = self._pointer; i < results.length; i++) {
            if (results[i]) self._writePayload(results[i])
          }
          self._pointer = results.length
        })
      }).finally(function() {
        if (!self._done) {
          if (self.pollInterval) setTimeout(pollForResult, self.pollInterval)
          else process.nextTick(pollForResult)
        }
      })
    }
    session.get(self.url).then(pollForResult)
  })
  .catch(function(err) {
    self._writePayload({ type: 'error', error: err })
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
        if (typeof self._runCallback === 'function') self._runCallback.call(self, 1)
      } else {
        if (typeof self._runCallback === 'function') self._runCallback.call(self, 0)
      }
    })
  } else {
    self.push(chunk)
    done()
  }
}

Lightfoot.prototype._writePayload = function(payload) {
  if (this._done) return
  this.write(xtend({
    capabilities: this._cfg,
  }, payload))
}
