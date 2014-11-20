# litefoot

Run your own tests in a real browser with selenium then stream the results out. Uses [leadfoot](https://github.com/theintern/leadfoot) under the hood.

[![NPM](https://nodei.co/npm/litefoot.png?downloads=true)](https://nodei.co/npm/litefoot/)

## install

```shell
npm install litefoot --save-dev
```

## usage

Install and run a [Selenium Server](http://www.seleniumhq.org/download/).

Add a `test` target to your `scripts` of your `package.json`:

```json
{
  "name": "myapp",
  "version": "0.1.0",
  "scripts": {
    "test": "litefoot --url=http://localhost:3000/test.html"
  },
  "devDependencies": {
    "litefoot": "^1.0.0"
  }
}
```

Then run the command `npm test` to run your test URL in a real browser via selenium.

### notifying litefoot

Your test suite can communicate with litefoot using a global variable stack: `window.NOTIFY_LITEFOOT`

When your tests are done, push an object to the stack:

```js
window.NOTIFY_LITEFOOT.push({ type: 'done', passed: 2, failed: 1 })
```

An example adapter if you're using QUnit:

```js
window.NOTIFY_LITEFOOT = []
function notifyLitefoot(type, payload) {
  payload.type = type
  payload.id = type + Date.now()
  window.NOTIFY_LITEFOOT.push(payload)
}
QUnit.begin(function(data) { notifyLitefoot('begin', data) })
QUnit.done(function(data) { notifyLitefoot('done', data) })
QUnit.testDone(function(data) { notifyLitefoot('testDone', data) })
QUnit.log(function(data) { notifyLitefoot('log', data) })
```

and now litefoot will know and report more info about the lifecycle of your test suite.

### using with sauce labs

> TODO: instructions coming soon

## api usage

```js
// Create an instance of litefoot
var litefoot = require('litefoot')({
  url: 'http://localhost:3000/test.html',
  browserName: 'firefox',
  varName: 'window.NOTIFY_LITEFOOT',
})

// Open a session and run the tests
litefoot.run(function(code) {
  litefoot.quit(function() {
    process.exit(code || 0)
  })
})

// Pipe to built in tap reporter or your own reporter
litefoot.pipe(require('litefoot/reporters/tap')()).pipe(process.stdout)
```

## Release History
* 1.0.0 - Initial release

## License
Copyright (c) 2014 Kyle Robinson Young  
Licensed under the MIT license.
