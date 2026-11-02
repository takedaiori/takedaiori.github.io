'use strict'
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const puppeteer = require('puppeteer-core')
const { headMarkup, bodyMarkup } = require('../../lib/security/frameGuard.cjs')
const fixture = `<!doctype html><html><head>${headMarkup}</head><body>${bodyMarkup}<button id="protected">Protected action</button></body></html>`
const testOrigins = []
const exportRoot = path.resolve('out')
const fixtureOnly = process.argv.includes('--fixture-only')
function exportedResponse(url, res) {
  let rel
  try { rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') } catch { res.writeHead(400).end(); return }
  const full = path.resolve(exportRoot, rel || 'index.html')
  if (!full.startsWith(exportRoot + path.sep)) { res.writeHead(403).end(); return }
  const file = [full, full + '.html', path.join(full, 'index.html')].find(name => fs.existsSync(name) && fs.lstatSync(name).isFile())
  if (!file) { res.writeHead(404).end('Not found'); return }
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
}
function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    if (url.pathname === '/parent') {
      // Never interpolate a caller-provided URL into the test HTML.
      const sourcePath = url.searchParams.get('surface') === 'guide' ? '/design-guide.html' : url.searchParams.get('surface') === 'app' ? '/' : '/fixture'
      const target = testOrigins[url.searchParams.get('target') === 'cross' ? 1 : 0] + sourcePath
      const mode = url.searchParams.get('mode')
      const sandbox = mode === 'script' ? ' sandbox="allow-scripts"' : mode === 'none' ? ' sandbox=""' : ''
      res.end(`<iframe src="${target}"${sandbox}></iframe>`)
    } else if (url.pathname === '/fixture' || fixtureOnly) res.end(fixture)
    else exportedResponse(url, res)
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
    await page.goto(a.origin + '/fixture')
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
    await page.goto(a.origin + '/fixture')
    assert.equal(await page.$eval('#protected', el => el.getClientRects().length), 0)
    assert(await page.$eval('#ins-frame-noscript', el => el.getClientRects().length > 0))
    checks.push('no-script warning replaces interactive content')
    if (!fixtureOnly) {
      await page.setJavaScriptEnabled(true)
      await page.setRequestInterception(true)
      page.on('request', request => {
        const u = request.url()
        testOrigins.some(origin => u.startsWith(origin + '/')) || u.startsWith('data:') ? request.continue() : request.abort()
      })
      for (const [surface, route, selector] of [['app', '/', '#__next'], ['guide', '/design-guide.html', 'main']]) {
        await page.goto(a.origin + route, { waitUntil: 'networkidle0' })
        assert(await page.$eval(selector, el => el.getClientRects().length > 0), surface + ' top-level')
        checks.push(surface + ' export visible at top level')
        for (const mode of ['script', 'none']) {
          await page.goto(`${a.origin}/parent?target=cross&surface=${surface}&mode=${mode}`, { waitUntil: 'networkidle0' })
          const frame = page.frames().find(frame => frame !== page.mainFrame())
          assert(frame)
          await frame.waitForSelector(selector)
          await new Promise(resolve => setTimeout(resolve, 1000))
          assert.equal(await frame.$eval(selector, el => el.getClientRects().length), 0, surface + ' stays hidden after hydration')
          checks.push(surface + ' export blocked in sandbox ' + mode)
        }
      }
    }
    const canonicalCount = fixtureOnly ? 0 : canonicalChecks(exportRoot)
    fs.mkdirSync('.perf', { recursive: true })
    fs.writeFileSync('.perf/frame-guard-smoke.json', JSON.stringify({ checks, canonicalCount }, null, 2) + '\n')
    console.log(`Frame protection: ${checks.length} browser checks; ${canonicalCount} exported canonical/guard checks passed`)
  } finally {
    if (browser) await browser.close()
    await Promise.all([a, b].map(({ server }) => new Promise(resolve => server.close(resolve))))
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
