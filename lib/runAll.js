var lightfoot = require('../index.js')
var mergeStream = require('merge-stream')
var async = require('async')

module.exports = function(browsers, concurrent, done) {
  if (typeof concurrent === 'function') {
    done = concurrent
    concurrent = 2
  }
  if (!Array.isArray(browsers)) browsers = [browsers]

  var exitcode = []

  var streams = []
  for (var i = 0; i < browsers.length; i++) {
    streams.push(lightfoot(browsers[i]))
  }

  var stream = mergeStream.apply(null, streams)
  var queue = async.queue(function(s, next) {
    s.run(function(code) {
      exitcode.push(code)
      this.quit(next)
    })
  }, concurrent)

  queue.drain = function() {
    if (typeof done === 'function') {
      done(exitcode)
    }
  }

  for (var i = 0; i < streams.length; i++) {
    queue.push(streams[i])
  }

  // Tell our reporters how many testers we're running
  stream.write({ type: 'multiple', amount: streams.length })

  stream.on('end', function() {
    var count = streams.length
    function next() {
      count--
      if (count < 1) stream.emit('close')
    }
    for (var i = 0; i < streams.length; i++) {
      streams[i].quit(next)
    }
  })

  return stream
}
