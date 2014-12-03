var lightfoot = require('../')
var runAll = require('../').runAll
var Reporter = require('../reporters/tap')
var st = require('st')
var http = require('http')
var test = require('tape')
var mergeStream = require('merge-stream')
var xtend = require('xtend')

var PORT = 8080
var URL = 'http://localhost:' + PORT
var DEBUG = false

var server = http.createServer(
  st({
    path: __dirname,
    index: 'test.html',
    cache: false,
  })
).listen(PORT)

var TEST_COUNT = 2
function nextTest() {
  TEST_COUNT--
  if (TEST_COUNT < 1) {
    server.close()
  }
}

test('should run tests in a single browser', function(t) {
  t.plan(2)
  
  var reporter = new Reporter()
  var result = ''
  var lf = lightfoot({
    browserName: 'chrome',
    url: URL,
  })
  lf.run(function() {
    if (DEBUG) {
      console.log('-----------------------------')
      console.log(result)
      console.log('-----------------------------')
    }
    t.ok(result.indexOf('# a test test in chrome') !== -1, 'a test test ran in chrome')
    t.ok(result.indexOf('ok 1 assertion has passed') !== -1, 'ok 1 assertion has passed')
    this.quit(nextTest)
  })
  lf.pipe(reporter)
  reporter.on('data', function(data) {
    result += data.toString()
  })
})

test('should run tests in multiple browsers simultaneously', function(t) {
  t.plan(8)

  var reporter = new Reporter()
  var result = ''
  var browsers = ['chrome', 'firefox'].map(function(browser) {
    return { browserName: browser, url: URL }
  })

  var stream = runAll(browsers, function(code) {
    if (DEBUG) {
      console.log('-----------------------------')
      console.log(result)
      console.log('-----------------------------')
    }
    t.ok(result.indexOf('# a test test in firefox') !== -1, 'a test test ran in firefox')
    t.ok(result.indexOf('ok 1 assertion has passed') !== -1, 'ok 1 assertion has passed')
    t.ok(result.indexOf('# a test test in chrome') !== -1, 'a test test ran in chrome')
    t.ok(result.indexOf('ok 3 assertion has passed') !== -1, 'ok 3 assertion has passed')
    t.ok(result.indexOf('1..4') !== -1, 'displayed 1..4')
    t.ok(result.indexOf('# tests 4') !== -1, 'displayed # tests 4')
    t.ok(result.indexOf('# pass 10') !== -1, 'displayed # pass 10')
    t.ok(result.indexOf('# fail 0') !== -1, 'displayed # fail 0')
    nextTest()
  })

  stream.pipe(reporter)
  reporter.on('data', function(data) {
    result += data.toString()
  })
})
