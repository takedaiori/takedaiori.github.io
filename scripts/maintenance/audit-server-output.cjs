'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { audit } = require('./site-artifact-audit.cjs')
function main() {
  if (!fs.existsSync('.next/BUILD_ID')) throw Error('A completed server build is required')
  const roots = ['public', '.next/static']
  if (fs.existsSync('.next/server/pages')) roots.push('.next/server/pages')
  const reports = roots.map(root => ({ root, ...audit(path.resolve(root), null) }))
  fs.mkdirSync('.perf', { recursive: true })
  fs.writeFileSync('.perf/server-output-audit.json', JSON.stringify(reports, null, 2) + '\n')
  let failed = false
  for (const report of reports) for (const finding of report.findings) {
    console.error(`${report.root}: ${finding.rule} (${finding.file})`)
    failed = true
  }
  console.log(`Server publish output scan: ${reports.reduce((n, r) => n + r.fileCount, 0)} files; ${failed ? 'BLOCKED' : 'passed'}`)
  if (failed) process.exitCode = 1
}
if (require.main === module) main()
