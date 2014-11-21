var Transform = require('stream').Transform
var inherits = require('util').inherits

function TapReporter() {
  if (!(this instanceof TapReporter)) return new TapReporter()
  var cfg = {objectMode: true}
  Transform.call(this, cfg)
  this._testNum = 0
  this._printedTotalTests = false
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
    case 'begin':
      log('\nTAP version 13')
      if (chunk.totalTests) {
        log('1..' + chunk.totalTests)
        this._printedTotalTests = true
      }
      break;
    case 'testStart':
      log('# ' + chunk.name)
      break;
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
      break;
    case 'done':
      log('')
      if (!this._printedTotalTests) {
        log('1..' + this._testNum)
      }
      log('# tests ' + (chunk.total || this._testNum))
      if (chunk.passed != null) log('# pass ' + chunk.passed)
      if (chunk.failed != null) log('# fail ' + chunk.failed)
      log('')
      break;
  }
  done()
}
