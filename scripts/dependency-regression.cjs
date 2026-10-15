const { chromium } = require('playwright')
const fs = require('fs')
const assert = require('assert/strict')
;(async () => {
  fs.mkdirSync('regression-evidence', { recursive: true })
  const http = require('http'), path = require('path')
  const servers = []
  for (const [port, root] of [[4173, path.join(process.env.RUNNER_TEMP, 'baseline/out')], [4174, path.resolve('out')]]) {
    const server = http.createServer((req,res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      const target = path.resolve(root, '.' + pathname)
      if (!target.startsWith(root + path.sep) && target !== root) {res.writeHead(403);return res.end()}
      const file = [target, target + '.html', path.join(target, 'index.html')].find(f => {try{return fs.statSync(f).isFile()}catch{return false}})
      if (!file) {res.writeHead(404);return res.end('Not found')}
      const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'}
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
      fs.createReadStream(file).pipe(res)
    })
    await new Promise(resolve => server.listen(port, resolve)); servers.push(server)
  }
  const browser = await chromium.launch()
  const results = []
  for (const width of [1440, 390]) {
    for (const route of ['/', '/page/1', '/archive', '/about', '/article/rwby-game']) {
      const pair = []
      for (const [label, port] of [['baseline', 4173], ['candidate', 4174]]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
        const errors = []
        page.on('pageerror', e => errors.push(e.message))
        const response = await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle' })
        assert(response.status() < 400, `${label} ${route}: ${response.status()}`)
        await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'})
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(2000)
        const snapshot = await page.evaluate(() => {
          const selectors = ['.ins-post-card', '.ins-article-list-card', '.ins-archive-card', '.ins-article-title', '.ins-notion-content .notion-list li', '.ins-notion-content .notion-text', '.ins-notion-content .notion-quote', '.ins-header', 'nav', 'button']
          const data = {}
          for (const selector of selectors) data[selector] = Array.from(document.querySelectorAll(selector)).map(e => {
            const s = getComputedStyle(e), r = e.getBoundingClientRect()
            return {text:e.textContent.trim(), color:s.color, background:s.backgroundColor, display:s.display, font:s.font, radius:s.borderRadius, width:Math.round(r.width), height:Math.round(r.height), left:Math.round(r.left), marker:getComputedStyle(e,'::marker').color}
          })
          return {title:document.title, text:document.body.innerText, data}
        })
        const stem = `${width}-${route.replace(/[^a-z0-9]/gi, '_')}-${label}`
        await page.screenshot({path:`regression-evidence/${stem}.png`,fullPage:true})
        pair.push({label, snapshot, errors})
        await page.close()
      }
      results.push({width,route,pair})
      fs.writeFileSync('regression-evidence/results.json', JSON.stringify(results,null,2))
      assert.deepEqual(pair[1].snapshot,pair[0].snapshot,`Page/style regression: ${width} ${route}`)
      assert.deepEqual(pair[1].errors,pair[0].errors,`New runtime error: ${width} ${route}`)
      if(route.includes('rwby')) for(const item of pair[1].snapshot.data['.ins-notion-content .notion-list li']) assert.equal(item.color,'rgb(242, 238, 228)')
      console.log(`PASS ${width} ${route}: text, card geometry, typography, colors, controls, runtime errors`)
    }
  }
  await browser.close()
  for (const server of servers) server.close()
})().catch(e=>{console.error(e);process.exit(1)})
