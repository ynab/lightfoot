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
  // TODO: Add failed assertions as comments
  switch (chunk.type) {
    case 'begin':
      this.push('\nTAP version 12\n')
      if (chunk.totalTests) {
        this.push('1..' + chunk.totalTests + '\n')
        this._printedTotalTests = true
      }
      break;
    case 'testDone':
      var msg = ''
      msg += (chunk.failed > 0) ? 'not ok ' : 'ok '
      msg += ++this._testNum
      msg += ' - ' + chunk.name
      this.push(msg + '\n')
      break;
    case 'done':
      if (!this._printedTotalTests) {
        this.push('1..' + this._testNum + '\n')
      }
      this.push('\n')
      break;
  }
  done()
}
