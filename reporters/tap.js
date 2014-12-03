var Transform = require('stream').Transform
var inherits = require('util').inherits

function TapReporter() {
  if (!(this instanceof TapReporter)) return new TapReporter()
  var cfg = {objectMode: true}
  Transform.call(this, cfg)
  this._testNum = 0
  this._multiple = 0
  this._multipleCounter = 0
  this._printedBegin = false
}
module.exports = TapReporter
inherits(TapReporter, Transform)

TapReporter.prototype._transform = function(chunk, encoding, done) {
  var self = this
  chunk = chunk || {}

  function log(msg) {
    self.push(msg + '\n')
  }

  switch (chunk.type) {
    case 'multiple':
      this._multiple = chunk.amount
      this._multipleCounter = 0
      break
    case 'begin':
      if (this._printedBegin) break
      this._printedBegin = true
      log('\nTAP version 13')
      break
    case 'testStart':
      var msg = '# ' + chunk.name
      if (chunk.capabilities && chunk.capabilities.browserName) {
        msg += ' in ' + chunk.capabilities.browserName
      }
      log(msg)
      break
    case 'log':
      var msg = ''
      msg += (chunk.result) ? 'ok ' : 'not ok '
      msg += ++this._testNum
      msg += ' ' + (chunk.message || '(unnamed assert)')
      log(msg)
      if (!chunk.result) {
        log('  ---')
        if (chunk.expected) log('    expected: ' + chunk.expected)
        if (chunk.actual) log('    actual: ' + chunk.actual)
        log('  ...')
      }
      break
    case 'error':
      log('\n# ERROR: ' + chunk.error.message + '\n')
      break
    case 'done':
      ++this._multipleCounter
      if (this._multiple === this._multipleCounter) {
        log('')
        log('1..' + this._testNum)
        log('# tests ' + (chunk.total || this._testNum))
        if (chunk.passed != null) log('# pass ' + chunk.passed)
        if (chunk.failed != null) log('# fail ' + chunk.failed)
        log('')
      }
      break
  }
  done()
}

