'use strict'
const { TestEnvironment } = require('jest-environment-jsdom')
const { TextEncoder, TextDecoder } = require('node:util')
// JSDOM 20 omits Fetch API globals. Use Node 22+'s actual implementations,
// rather than stubbing Clerk's runtime or suppressing module-load failures.
class BrowserEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context)
    for (const name of ['Request', 'Response', 'Headers', 'fetch']) {
      this.global[name] = globalThis[name]
    }
    this.global.TextEncoder = TextEncoder
    this.global.TextDecoder = TextDecoder
  }
}
module.exports = BrowserEnvironment
