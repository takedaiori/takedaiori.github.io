const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const pagesDir = process.env.PERF_PAGE_DATA_DIR || path.join(projectRoot, '.next', 'server', 'pages')
const reportDir = process.env.PERF_REPORT_DIR || path.join(projectRoot, '.perf')
const reportFile = path.join(reportDir, 'page-data-budget.json')
const warnBudgetKb = Number(process.env.PERF_PAGE_DATA_WARN_KB || 128)
const failOnBudget = process.env.PERF_PAGE_DATA_FAIL === 'true'
const listFailBudgetKb = Number(process.env.PERF_LIST_DATA_FAIL_KB || 256)
const isListRoute = route => /^\/(archive|category|tag)(\/|$)/.test(route) || /^\/page\/\d+$/.test(route)

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walkJsonFiles(fullPath)
    if (
      entry.isFile() &&
      entry.name.endsWith('.json') &&
      !entry.name.endsWith('.js.nft.json')
    ) {
      return [fullPath]
    }
    return []
  })
}

function routeFromFile(file) {
  const relative = path.relative(pagesDir, file).replace(/\\/g, '/')
  const withoutExt = relative.replace(/\.json$/, '')
  if (withoutExt === 'index') return '/'
  return `/${withoutExt.replace(/\/index$/, '')}`
}

function formatKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10
}

function main() {
  const files = walkJsonFiles(pagesDir)
  if (!files.length) {
    console.error('No page-data JSON files found. Run `yarn build` first.')
    process.exit(1)
  }

  const pages = files
    .map(file => {
      const bytes = fs.statSync(file).size
      return {
        route: routeFromFile(file),
        bytes,
        kb: formatKb(bytes),
        overBudget: bytes > warnBudgetKb * 1024,
        listOverLimit: isListRoute(routeFromFile(file)) && bytes > listFailBudgetKb * 1024
      }
    })
    .sort((a, b) => b.bytes - a.bytes)

  const report = {
    generatedAt: new Date().toISOString(),
    warnBudgetKb,
    listFailBudgetKb,
    totalPages: pages.length,
    overBudgetPages: pages.filter(page => page.overBudget).length,
    largestPages: pages.slice(0, 20),
    pages
  }

  fs.mkdirSync(reportDir, { recursive: true })
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`)

  console.log(`Page-data budget report written to ${reportFile}`)
  console.table(
    report.largestPages.map(page => ({
      route: page.route,
      kb: page.kb,
      overBudget: page.overBudget
    }))
  )

  const listFailures = pages.filter(page => page.listOverLimit)
  // Always identify blockers even when large article pages fill the top 20.
  for (const page of listFailures) {
    console.error(`::error::List page ${page.route}: ${page.kb} KiB exceeds ${listFailBudgetKb} KiB`)
  }
  for (const page of pages.filter(page => page.overBudget)) {
    console.log(`::warning::Page data ${page.route}: ${page.kb} KiB (warning budget ${warnBudgetKb} KiB)`)
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const rows = pages.slice(0, 20).map(page => `| ${page.route.replace(/\|/g, '%7C')} | ${page.kb} | ${page.listOverLimit ? 'OVER LIMIT' : page.overBudget ? 'Warning' : 'OK'} |`)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `\n### Page data budget\n\n${pages.length} pages checked. Warning: ${warnBudgetKb} KiB; list hard limit: ${listFailBudgetKb} KiB.\n\n| Route | KiB | Result |\n| --- | ---: | --- |\n${rows.join('\n')}\n`)
  }
  if (listFailures.length || (failOnBudget && report.overBudgetPages > 0)) {
    console.error(`::error::Page data budget exceeded: ${listFailures.length} list pages above ${listFailBudgetKb} KiB. Report: ${reportFile}`)
    process.exit(1)
  }
}

main()
