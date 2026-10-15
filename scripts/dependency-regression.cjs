const { chromium } = require('playwright')
const fs = require('fs')
const assert = require('assert/strict')
;(async () => {
  fs.mkdirSync('regression-evidence', { recursive: true })
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
})().catch(e=>{console.error(e);process.exit(1)})
