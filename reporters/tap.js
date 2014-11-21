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
  chunk = chunk || {}
  switch (chunk.type) {
    case 'begin':
      this.push('\nTAP version 13\n')
      if (chunk.totalTests) {
        this.push('1..' + chunk.totalTests + '\n')
        this._printedTotalTests = true
      }
      break;
    case 'testStart':
      this.push('# ' + chunk.name + '\n')
      break;
    case 'log':
      var msg = ''
      msg += (chunk.result) ? 'ok ' : 'not ok '
      msg += ++this._testNum
      msg += ' ' + (chunk.message || '(unnamed assert)')
      this.push(msg + '\n')
      if (!chunk.result) {
        msg = '  ---\n'
        if (chunk.expected) msg += '    expected: ' + chunk.expected + '\n'
        if (chunk.actual) msg += '    actual: ' + chunk.actual + '\n'
        msg += '  ...\n'
        this.push(msg + '\n')
      }
      break;
    case 'done':
      this.push('\n')
      if (!this._printedTotalTests) {
        this.push('1..' + this._testNum + '\n')
      }
      this.push('# tests ' + (chunk.total || this._testNum) + '\n')
      if (chunk.passed != null) this.push('# pass ' + chunk.passed + '\n')
      if (chunk.failed != null) this.push('# fail ' + chunk.failed + '\n')
      this.push('\n')
      break;
  }
  done()
}
