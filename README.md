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
  payload.id = type + Date.now()
  window.NOTIFY_LIGHTFOOT.push(payload)
}
QUnit.begin(function(data) { notifyLightfoot('begin', data) })
QUnit.done(function(data) { notifyLightfoot('done', data) })
QUnit.testDone(function(data) { notifyLightfoot('testDone', data) })
QUnit.log(function(data) { notifyLightfoot('log', data) })
```

and now lightfoot will know and report more info about the lifecycle of your test suite.

### using with sauce labs

> TODO: instructions coming soon

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
  lightfoot.quit(function() {
    process.exit(code || 0)
  })
})

// Pipe to built in tap reporter or your own reporter
lightfoot.pipe(require('lightfoot/reporters/tap')()).pipe(process.stdout)
```

## Release History
* 1.0.0 - Initial release

## License
Copyright (c) 2014 YouNeedABudget.com  
Licensed under the MIT license.
