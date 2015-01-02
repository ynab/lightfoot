# lightfoot

Run your own tests in a real browser with selenium then stream the results out. Uses [leadfoot](https://github.com/theintern/leadfoot) under the hood.

[![NPM](https://nodei.co/npm/lightfoot.png?downloads=true)](https://nodei.co/npm/lightfoot/)

## install

```shell
npm install lightfoot --save-dev
```

## usage

Install and run a [Selenium Server](http://www.seleniumhq.org/download/).

Add a `test` target to your `scripts` of your `package.json`:

```json
{
  "name": "myapp",
  "version": "0.1.0",
  "scripts": {
    "test": "lightfoot --url=http://localhost:3000/test.html"
  },
  "devDependencies": {
    "lightfoot": "^1.0.0"
  }
}
```

Then run the command `npm test` to run your test URL in a real browser via selenium.

### notifying lightfoot

Your test suite can communicate with lightfoot using a global variable stack: `window.NOTIFY_LIGHTFOOT`

When your tests are done, push an object to the stack:

```js
window.NOTIFY_LIGHTFOOT.push({ type: 'done', passed: 2, failed: 1 })
```

An example adapter if you're using QUnit:

```js
window.NOTIFY_LIGHTFOOT = []
function notifyLightfoot(type, payload) {
  payload.type = type
  window.NOTIFY_LIGHTFOOT.push(payload)
}
QUnit.begin(function(data) { notifyLightfoot('begin', data) })
QUnit.done(function(data) { notifyLightfoot('done', data) })
QUnit.testDone(function(data) { notifyLightfoot('testDone', data) })
QUnit.log(function(data) { notifyLightfoot('assertion', data) })
```

and now lightfoot will know and report more info about the lifecycle of your test suite.

## api usage

```js
// Create an instance of lightfoot
var lightfoot = require('lightfoot')({
  url: 'http://localhost:3000/test.html',
  browserName: 'firefox',
  varName: 'window.NOTIFY_LIGHTFOOT',
})

// Open a session and run the tests
lightfoot.run(function(code) {
  process.exit(code || 0)
})

// Pipe to built in tap reporter or your own reporter
lightfoot.pipe(require('lightfoot/reporters/tap')()).pipe(process.stdout)
```

### running multiple sessions concurrently

There is a built in helper to run mutliple sessions concurrently:

```js
var runAll = require('lightfoot').runAll
// Run each of these sessions with 2 at a time concurrently
runAll([
  { url: 'http://localhost:3000/test.html?module=one.js', browserName: 'chrome' },
  { url: 'http://localhost:3000/test.html?module=two.js', browserName: 'chrome' },
  { url: 'http://localhost:3000/test.html?module=one.js', browserName: 'firefox' },
  { url: 'http://localhost:3000/test.html?module=two.js', browserName: 'firefox' },
], 2, function(codes) {
  // Exit with the greatest exit code
  process.exit(codes.reduce(function(code, last) {
    return (code > last) ? code : last;
  }, 0))
})
```

### using with sauce labs

Install and run [Sauce Connect](https://docs.saucelabs.com/reference/sauce-connect/)

Specify the Sauce Labs Selenium web driver URL with your username and access key:

```js
require('lightfoot')({
  url: 'http://localhost:3000/test.html',
  seleniumUrl: 'http://username:accessKey@ondemand.saucelabs.com:80/wd/hub',
}).run(function(code) {
  process.exit(code || 0)
})
```

Now through all kinds of mad science, your tests served locally are ran in a real browser at Sauce Labs and reported to your terminal.

## Release History
* 1.5.0 - Rename `log` event to `assertion`. `log` is now used to track `console.log` messages in the browser.
* 1.4.0 - Ability to specify capabilities. Helper for running multiple sessions concurrently. Pipe errors to reporter when they occur.
* 1.3.1 - Add repository field to package.json. Ensure assertions on pretty reporter go on their own line.
* 1.3.0 - Add pretty reporter
* 1.2.1 - Avoid multiple `done()` calls on finish
* 1.2.0 - Do not call `quit()` automatically any more to allow for async clean up. User must call `quit()`
* 1.1.1 - Ensure quit is called before runCallback
* 1.1.0 - Fixes to prevent runner from hanging. id is no longer required. Fixes to tap reporter. session and sessionId is exposed. quit is called upon the end automatically now.
* 1.0.0 - Initial release

## License
Copyright (c) 2014 YouNeedABudget.com
Licensed under the MIT license.
