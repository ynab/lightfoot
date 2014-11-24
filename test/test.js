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
  var result = ''
  var lightfoot = new Lightfoot(cfg).run(function() {
    t.ok(result.indexOf('ok 1 assertion has passed') !== -1, 'first test reported')
    t.ok(result.indexOf('ok 2 assertion has passed too') !== -1, 'second test reported')
    lightfoot.quit(function() {
      server.close()
    })
  })
  lightfoot.pipe(reporter)
  reporter.on('data', function(data) {
    result += data.toString()
  })
})
