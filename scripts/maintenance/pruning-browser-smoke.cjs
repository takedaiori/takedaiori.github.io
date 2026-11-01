'use strict'
// Runs only in an isolated validation runner; never publishes or edits source.
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const puppeteer = require('puppeteer-core')
const plan = require('../../pruning-plan.json')
const baseline = path.resolve('.tmp/pruning-baseline')
const simulation = path.resolve('.tmp/pruning-simulation')
const candidate = path.resolve('out')
const digest = data => crypto.createHash('sha256').update(data).digest('hex')
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' }
function serve(root) {
  const server = http.createServer((req, res) => {
    let rel
    try { rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') } catch { res.writeHead(400).end(); return }
    const full = path.resolve(root, rel || 'index.html')
    if (!full.startsWith(root + path.sep)) { res.writeHead(403).end(); return }
    const file = [full, full + '.html', path.join(full, 'index.html')].find(name => fs.existsSync(name) && fs.statSync(name).isFile())
    if (!file) { res.writeHead(404).end('Not found'); return }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
    fs.createReadStream(file).pipe(res)
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })))
}
async function capture(browser, origin, route, mobile) {
  const page = await browser.newPage()
  const errors = [], missing = []
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 1 } : { width: 1280, height: 900, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(() => { window.setInterval = () => 0 })
  await page.setRequestInterception(true)
  page.on('request', req => { req.url().startsWith(origin) || req.url().startsWith('data:') ? req.continue() : req.abort() })
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => {
    if (response.url().startsWith(origin) && response.status() >= 400) missing.push(new URL(response.url()).pathname)
  })
  const response = await page.goto(origin + route, { waitUntil: 'networkidle0', timeout: 30000 })
  assert.equal(response.status(), 200, route)
  await page.waitForFunction(() => !document.documentElement.classList.contains('ins-initial-loading') && !document.querySelector('.ins-layout-loading-label'), { timeout: 15000 })
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
  await page.evaluate(async () => { await document.fonts.ready })
  const metrics = await page.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('main h1, main h2, .ins-page-kicker')?.textContent?.trim() || '',
    header: (() => { const e = document.querySelector('.ins-site-header'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height] })(),
    cards: document.querySelectorAll('.ins-article-list-card').length
  }))
  const image = await page.screenshot()
  await page.close()
  return { ...metrics, errors: [...new Set(errors)], missing: [...new Set(missing)], screenshot: image, screenshotHash: digest(image) }
}
async function main() {
  assert(fs.existsSync(path.join(baseline, 'index.html')), 'Published baseline was not downloaded')
  fs.cpSync(baseline, simulation, { recursive: true })
  let removedBytes = 0
  for (const asset of plan.assets) {
    const rel = asset.path.replace(/^public\//, '')
    const file = path.join(simulation, rel)
    if (!fs.existsSync(file)) continue
    assert.equal(digest(fs.readFileSync(file)), asset.sha256, `Baseline asset changed: ${rel}`)
    removedBytes += fs.statSync(file).size
    fs.unlinkSync(file)
    assert(!fs.existsSync(path.join(candidate, rel)), `Candidate still exports removed asset: ${rel}`)
  }
  const servers = await Promise.all([baseline, simulation, candidate].map(serve))
  let browser
  const report = { simulatedRemovedBytes: removedBytes, checks: [] }
  fs.mkdirSync('.perf/pruning-screenshots', { recursive: true })
  const routes = ['/', '/archive', '/archive/year/2026/page/1', '/category/WPD%20Archive', '/category/WPD%20Archive/page/2', '/article/make-two-demos-using-ai-from-scratch', '/about', '/design-guide', '/content-rights.html', '/privacy.html']
  try {
    browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'] })
    for (const mobile of [false, true]) for (const route of routes) {
      const before = await capture(browser, servers[0].origin, route, mobile)
      const simulated = await capture(browser, servers[1].origin, route, mobile)
      const built = await capture(browser, servers[2].origin, route, mobile)
      assert.deepEqual(simulated.errors.filter(error => !before.errors.includes(error)), [], `New simulation errors: ${route}`)
      assert.deepEqual(simulated.missing.filter(url => !before.missing.includes(url)), [], `New simulation 404s: ${route}`)
      assert.equal(simulated.screenshotHash, before.screenshotHash, `Simulation changed pixels: ${route} mobile=${mobile}`)
      assert.deepEqual(built.errors.filter(error => !before.errors.includes(error)), [], `New candidate errors: ${route}`)
      assert.deepEqual(built.missing.filter(url => !before.missing.includes(url)), [], `New candidate 404s: ${route}`)
      assert.equal(built.heading, before.heading, `Heading changed: ${route}`)
      assert.deepEqual(built.header, before.header, `Header geometry changed: ${route}`)
      assert.equal(built.cards, before.cards, `List card count changed: ${route}`)
      const name = (route.replace(/[^a-z0-9]/gi, '_') || 'home') + (mobile ? '-mobile' : '-desktop')
      for (const [label, result] of [['before', before], ['simulation', simulated], ['candidate', built]]) fs.writeFileSync(`.perf/pruning-screenshots/${name}-${label}.png`, result.screenshot)
      report.checks.push({ route, mobile, simulationPixelsEqual: true, candidateHeadingAndHeaderMatch: true, baselineMissing: before.missing, baselineErrors: before.errors })
      console.log(`PASS ${mobile ? 'mobile' : 'desktop'} ${route}`)
    }
  } finally {
    if (browser) await browser.close()
    await Promise.all(servers.map(({ server }) => new Promise(resolve => server.close(resolve))))
    fs.writeFileSync('.perf/pruning-smoke.json', JSON.stringify(report, null, 2) + '\n')
  }
  console.log(`Pruning smoke: ${report.checks.length} route/viewport checks; ${removedBytes} bytes removed in simulation`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
