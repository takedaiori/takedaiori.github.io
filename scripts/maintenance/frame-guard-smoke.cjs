'use strict'
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const puppeteer = require('puppeteer-core')
const { headMarkup, bodyMarkup } = require('../../lib/security/frameGuard.cjs')
const fixture = `<!doctype html><html><head>${headMarkup}</head><body>${bodyMarkup}<button id="protected">Protected action</button></body></html>`
const testOrigins = []
function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    if (url.pathname === '/parent') {
      // Never interpolate a caller-provided URL into the test HTML.
      const target = testOrigins[url.searchParams.get('target') === 'cross' ? 1 : 0]
      const mode = url.searchParams.get('mode')
      const sandbox = mode === 'script' ? ' sandbox="allow-scripts"' : mode === 'none' ? ' sandbox=""' : ''
      res.end(`<iframe src="${target}"${sandbox}></iframe>`)
    } else res.end(fixture)
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })))
}
function canonicalChecks(root) {
  const routes = ['index.html', 'archive.html', 'category/WPD Archive/page/2.html', 'content-rights.html', 'privacy.html', 'design-guide.html']
  const articleDir = path.join(root, 'article')
  if (fs.existsSync(articleDir)) {
    const article = fs.readdirSync(articleDir).find(name => name.endsWith('.html'))
    if (article) routes.push('article/' + article)
  }
  for (const file of routes) {
    const full = path.join(root, file)
    assert(fs.existsSync(full), `Missing route fixture ${file}`)
    const html = fs.readFileSync(full, 'utf8')
    assert(html.includes('ins-frame-guard-script'), `Frame guard missing: ${file}`)
    const links = [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)]
    assert.equal(links.length, 1, `Canonical count: ${file}`)
    const href = /\bhref=["']([^"']+)["']/i.exec(links[0][0])?.[1]
    const url = new URL(href.replace(/&amp;/g, '&'))
    assert.equal(url.origin, 'https://takedaiori.github.io', `Canonical origin: ${file}`)
    const expected = file === 'index.html' ? '/' : ['content-rights.html', 'privacy.html'].includes(file) ? '/' + file : '/' + file.replace(/\.html$/, '')
    assert.equal(decodeURIComponent(url.pathname).replace(/\/$/, '') || '/', expected, `Canonical path: ${file}`)
  }
  return routes.length
}
async function main() {
  const a = await serve(), b = await serve()
  testOrigins.push(a.origin, b.origin)
  let browser
  const checks = []
  try {
    browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    const page = await browser.newPage()
    await page.goto(a.origin)
    assert(await page.$eval('#protected', el => el.getClientRects().length > 0))
    checks.push('top-level content visible')
    for (const [name, origin, mode] of [['same-origin', a.origin, 'plain'], ['cross-origin', b.origin, 'plain'], ['sandbox scripts', b.origin, 'script'], ['sandbox no scripts', b.origin, 'none']]) {
      await page.goto(`${a.origin}/parent?target=${origin === b.origin ? 'cross' : 'same'}&mode=${mode}`)
      const frame = page.frames().find(frame => frame !== page.mainFrame())
      assert(frame, name)
      await frame.waitForSelector('#protected')
      assert.equal(await frame.$eval('#protected', el => el.getClientRects().length), 0, name)
      assert(new URL(page.url()).pathname === '/parent', 'Guard must not force top navigation')
      checks.push(name + ' action hidden')
    }
    await page.setJavaScriptEnabled(false)
    await page.goto(a.origin)
    assert.equal(await page.$eval('#protected', el => el.getClientRects().length), 0)
    assert(await page.$eval('#ins-frame-noscript', el => el.getClientRects().length > 0))
    checks.push('no-script warning replaces interactive content')
    const canonicalCount = process.argv.includes('--fixture-only') ? 0 : canonicalChecks(path.resolve('out'))
    fs.mkdirSync('.perf', { recursive: true })
    fs.writeFileSync('.perf/frame-guard-smoke.json', JSON.stringify({ checks, canonicalCount }, null, 2) + '\n')
    console.log(`Frame protection: ${checks.length} browser checks; ${canonicalCount} exported canonical/guard checks passed`)
  } finally {
    if (browser) await browser.close()
    await Promise.all([a, b].map(({ server }) => new Promise(resolve => server.close(resolve))))
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
