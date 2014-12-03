var lightfoot = require('../index.js')
var mergeStream = require('merge-stream')
var xtend = require('xtend')

module.exports = function(browsers, done) {
  if (!Array.isArray(browsers)) browsers = [browsers]

  var exitcode = []
  var count = browsers.length
  function next() {
    count--
    if (count < 1 && typeof done === 'function') {
      done(exitcode)
    }
  }

  var streams = []
  for (var i = 0; i < browsers.length; i++) {
    streams.push(lightfoot(browsers[i]))
  }

  var stream = mergeStream.apply(null, streams)
  for (var i = 0; i < streams.length; i++) {
    streams[i].run(function(code) {
      exitcode.push(code)
      this.quit(next)
    })
  }

  // Tell our reporters how many testers we're running
  stream.write({ type: 'multiple', amount: streams.length })

  return stream
}
