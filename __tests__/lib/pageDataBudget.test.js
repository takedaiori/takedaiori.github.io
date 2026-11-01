/** @jest-environment node */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'page-budget-'))
afterAll(() => fs.rmSync(root, { recursive: true, force: true }))
function check(route, kb) {
  const dir = fs.mkdtempSync(path.join(root, 'case-'))
  const input = path.join(dir, 'input')
  const target = path.join(input, `${route}.json`)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, JSON.stringify({ data: 'x'.repeat(kb * 1024) }))
  const summary = path.join(dir, 'summary.md')
  const run = spawnSync(process.execPath, ['scripts/check-page-data-budget.js'], {
    cwd: process.cwd(), encoding: 'utf8', env: { ...process.env,
      PERF_PAGE_DATA_DIR: input, PERF_REPORT_DIR: path.join(dir, 'report'),
      PERF_PAGE_DATA_WARN_KB: '128', PERF_LIST_DATA_FAIL_KB: '256',
      PERF_PAGE_DATA_FAIL: 'false', GITHUB_STEP_SUMMARY: summary }
  })
  return { ...run, summary: fs.readFileSync(summary, 'utf8') }
}
test('reports normal data and warns without blocking a large article', () => {
  expect(check('archive/index', 20).status).toBe(0)
  const article = check('article/long-essay', 300)
  expect(article.status).toBe(0)
  expect(article.stdout).toContain('::warning::')
  expect(article.summary).toContain('Warning')
})
test('blocks oversized archive and category data before publishing', () => {
  for (const route of ['archive/year/2026/page/1', 'category/WPD Archive/page/2']) {
    const run = check(route, 260)
    expect(run.status).toBe(1)
    expect(run.stderr).toContain('::error::')
    expect(run.summary).toContain('OVER LIMIT')
  }
})
