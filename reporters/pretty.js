var Transform = require('stream').Transform
var inherits = require('util').inherits
var chalk = require('chalk')
var prettyMs = require('pretty-ms')

function PrettyReporter(verbose) {
  this.verbose = verbose
  if (!(this instanceof PrettyReporter)) return new PrettyReporter(verbose)
  var cfg = {objectMode: true}
  Transform.call(this, cfg)
}
module.exports = PrettyReporter
inherits(PrettyReporter, Transform)

var lastAssertions = []
var lastConsoleLogs = []
var skipped = 0

PrettyReporter.prototype._transform = function(chunk, encoding, done) {
  var self = this
  var msg = ''
  chunk = chunk || {}

  function log(msg) {
    self.push(msg + '\n')
  }

  switch (chunk.type) {
    case 'begin':
      log(chalk.blue('Lightfoot waiting for results...\n'))
      break
    case 'testStart':
      log('# ' + chunk.name)
      break
    case 'testDone':
      if (chunk.failed > 0) {
        msg += chalk.red('✖ ') + chunk.name + '\n'
        lastAssertions.forEach(function (assert) {
          msg += '  '
          msg += (assert.result) ? chalk.green('✔ ') : chalk.red('✖ ')
          msg += assert.message || ''
          if (assert.expected) {
            msg += ', expected: ' + assert.expected + ', but was: ' + assert.actual
          }
          if (assert.source) msg += '\n' + assert.source
        })
        msg += '\n'
        msg += chalk.cyan('START: ' + new Array(80).join('=')) + '\n'
        msg += lastConsoleLogs.filter(function (log) {
          return !!log
        }).join('\n') + '\n'
        msg += chalk.cyan('END: ' + new Array(80).join('=') + '\n') + '\n'
      } else {
        if (chunk.name.indexOf('(SKIPPED)') !== -1) {
          skipped++
          msg += chalk.yellow('- ') + chalk.gray(chunk.name)
          if (self.verbose) msg += '\n'
        } else {
          msg += chalk.green('✔ ') + chunk.name + ' ' + chalk.gray(prettyMs(chunk.runtime))
          lastAssertions.forEach(function (assert) {
            if (!self.verbose || !assert.message) return
            msg += '\n  '
            msg += chalk.green('✔ ') + chalk.gray(assert.message || '')
          })
          if (self.verbose) msg += '\n'
        }
      }
      log(msg)
      lastConsoleLogs = []
      lastAssertions = []
      break
    case 'log':
      lastAssertions.push(chunk)
      break
    case 'done':
      msg += '\n'
      if (chunk.failed > 0) {
        msg += chalk.inverse.red(new Array(10).join('!'))
        msg += chalk.inverse.red(' FAILED ')
        msg += chalk.inverse.red(new Array(10).join('!'))
      } else {
        testSucceeded = true
        msg += chalk.inverse.green(new Array(10).join('*'))
        msg += chalk.inverse.green(' SUCCESS ')
        msg += chalk.inverse.green(new Array(10).join('*'))
      }
      msg += '\n\n'
      msg += chalk.green(chunk.passed + ' passed') + ' / '
      msg += chalk.yellow(skipped + ' skipped') + ' / '
      msg += chalk.red(chunk.failed + ' failed') + '\n'
      msg += chalk.gray('Ran ' + chunk.total + ' tests in ' + prettyMs(chunk.runtime))
      log(msg)
      break
  }
  done()
}
