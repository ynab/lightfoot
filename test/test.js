var Lightfoot = require('../')
var Reporter = require('../reporters/tap')
var st = require('st')
var http = require('http')
var test = require('tape')

var PORT = 8080
var cfg = {
  url: 'http://localhost:' + PORT,
}

test('should run tests', function(t) {
  t.plan(2)
  var server = http.createServer(
    st({
      path: __dirname,
      index: 'test.html',
      cache: false,
    })
  ).listen(PORT)

  var reporter = new Reporter()
  var lightfoot = new Lightfoot(cfg).run()
  lightfoot.pipe(reporter)

  var result = ''
  reporter.on('data', function(data) {
    result += data.toString()
  })
  lightfoot.on('end', function() {
    t.ok(result.indexOf('ok 1 - a test test') !== -1, 'first test reported')
    t.ok(result.indexOf('ok 2 - a test part two') !== -1, 'second test reported')
    server.close()
  })
})
