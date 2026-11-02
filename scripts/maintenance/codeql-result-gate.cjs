'use strict'
const fs = require('node:fs')
const path = require('node:path')
function findings(report) {
  if (report.version !== '2.1.0' || !Array.isArray(report.runs) || !report.runs.length) throw Error('Invalid SARIF report')
  let count = 0
  for (const run of report.runs) {
    if (!run.tool?.driver?.name || (run.results !== undefined && !Array.isArray(run.results))) throw Error('Incomplete SARIF run')
    if ((run.invocations || []).some(invocation => invocation.executionSuccessful === false)) throw Error('CodeQL invocation failed')
    for (const result of run.results || []) {
      if (!['pass', 'notApplicable'].includes(result.kind)) {
        count++
        // Rule IDs and repository paths are enough to locate a finding. Never log messages or source snippets.
        const clean = value => String(value || 'unknown').replace(/[^A-Za-z0-9_./:@-]/g, '_').slice(0, 240)
        const location = result.locations?.[0]?.physicalLocation
        console.log(`CodeQL finding: ${clean(result.ruleId)} ${clean(location?.artifactLocation?.uri)}:${Number(location?.region?.startLine) || 0}`)
      }
    }
  }
  return count
}
function check(directory) {
  let files = 0, count = 0
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isSymbolicLink()) throw Error('Unexpected SARIF symlink')
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name.endsWith('.sarif')) {
        files++
        count += findings(JSON.parse(fs.readFileSync(full, 'utf8')))
      }
    }
  }
  walk(directory)
  if (!files) throw Error('CodeQL produced no SARIF results')
  console.log(`CodeQL result gate: ${files} report(s), ${count} finding(s)`)
  // Do not print messages/snippets or silently ignore suppressed findings.
  if (count) throw Error('Review and resolve CodeQL findings in the Security tab before merging')
}
module.exports = { findings, check }
if (require.main === module) {
  try { check(process.argv[2] || '.perf/codeql-results') }
  catch (error) { console.error(error instanceof SyntaxError ? 'Invalid CodeQL JSON' : error.message); process.exitCode = 1 }
}
