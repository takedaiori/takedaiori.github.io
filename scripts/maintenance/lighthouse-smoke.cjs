'use strict'

// Exercise the maintenance tool itself: Next.js export does not load this path.
const assert = require('node:assert/strict')
const { execFile } = require('node:child_process')
const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { createRequire } = require('node:module')
const { promisify } = require('node:util')

async function main() {
  for (const parent of ['eslint', '@eslint/eslintrc']) {
    const fromParent = createRequire(require.resolve(`${parent}/package.json`))
    const version = fromParent('ajv/package.json').version
    assert.match(version, /^6\./, `${parent} must retain AJV 6`)
    console.log(`${parent}: AJV ${version}`)
  }
  const fromFormats = createRequire(require.resolve('ajv-formats'))
  const version = fromFormats('ajv/package.json').version
  assert.match(version, /^8\./, 'ajv-formats must resolve AJV 8')
  const Ajv = fromFormats('ajv')
  const validator = new Ajv()
  require('ajv-formats')(validator)
  const validate = validator.compile({ type: 'string', format: 'email' })
  assert.equal(validate('reader@example.com'), true)
  assert.equal(validate('invalid'), false)
  console.log(`ajv-formats: AJV ${version}, format validation passed`)

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-smoke-'))
  const server = http.createServer((req, res) => {
    if (req.url === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      return res.end('User-agent: *\nAllow: /\n')
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Local Lighthouse compatibility fixture"><title>Lighthouse smoke test</title></head><body><main><h1>Compatibility test</h1><p>A local page for checking report generation.</p></main></body></html>')
  })
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const url = `http://127.0.0.1:${server.address().port}/`
    const config = path.join(directory, 'lighthouserc.json')
    fs.writeFileSync(config, JSON.stringify({ ci: { collect: {
      url: [url], numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox --disable-dev-shm-usage', throttlingMethod: 'provided' }
    } } }))
    const cli = require.resolve('@lhci/cli/src/cli.js')
    const { stdout } = await promisify(execFile)(process.execPath, [cli, 'collect', `--config=${config}`], {
      cwd: directory, timeout: 120000, maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, LHCI_CHROME_PATH: process.env.LHCI_CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => fs.existsSync(p)) || '' }
    })
    console.log(stdout)
    const reports = fs.readdirSync(path.join(directory, '.lighthouseci')).filter(name => /^lhr-.*\.json$/.test(name))
    assert.ok(reports.length, 'LHCI must produce a JSON report')
    const report = JSON.parse(fs.readFileSync(path.join(directory, '.lighthouseci', reports[0]), 'utf8'))
    assert.ok(!report.runtimeError, JSON.stringify(report.runtimeError))
    assert.ok(report.categories.performance && report.audits['first-contentful-paint'])
    const assertions = require('../../lighthouserc.js').ci.assert.assertions
    for (const name of Object.keys(assertions)) {
      if (name.startsWith('categories:')) assert.ok(report.categories[name.slice(11)], `Removed Lighthouse category: ${name}`)
      else assert.ok(report.audits[name], `Removed Lighthouse audit: ${name}`)
    }
    console.log(`Lighthouse ${report.lighthouseVersion}: collection, report generation and configured audit names passed`)
  } finally {
    await new Promise(resolve => server.close(resolve))
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

main().catch(error => {
  console.error(error.stderr || error.stack || error)
  process.exitCode = 1
})
