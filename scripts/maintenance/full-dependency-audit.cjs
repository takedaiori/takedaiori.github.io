'use strict'
const fs = require('node:fs')
const { lockEntries } = require('./dependency-lock-diff.cjs')
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw Error(`Vulnerability service failed: ${response.status}`)
  return response.json()
}
async function audit(lock, query = request) {
  const packages = [...new Map(lockEntries(lock).map(({ name, version }) => [name + '@' + version, { name, version }])).values()]
  const findings = [], details = new Map()
  const starts = Array.from({ length: Math.ceil(packages.length / 50) }, (_, i) => i * 50)
  let cursor = 0
  async function worker() {
    while (cursor < starts.length) {
      const start = starts[cursor++]
    let pending = packages.slice(start, start + 50).map(p => ({ package: { name: p.name, ecosystem: 'npm' }, version: p.version }))
    let rounds = 0
    while (pending.length) {
      if (++rounds > 30) throw Error('Vulnerability pagination did not complete')
      const result = await query('https://api.osv.dev/v1/querybatch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ queries: pending })
      })
      if (!Array.isArray(result.results) || result.results.length !== pending.length) throw Error('Incomplete vulnerability response')
      const next = []
      for (const [i, item] of result.results.entries()) {
        for (const vuln of item.vulns || []) {
          if (!/^GHSA-[a-z0-9-]+$|^CVE-\d{4}-\d+$/.test(vuln.id)) throw Error('Unexpected advisory identifier')
          if (!details.has(vuln.id)) details.set(vuln.id, await query('https://api.osv.dev/v1/vulns/' + vuln.id))
          const detail = details.get(vuln.id)
          if (!detail.withdrawn) findings.push({ name: pending[i].package.name, version: pending[i].version,
            id: vuln.id, severity: detail.database_specific?.severity || 'UNKNOWN', summary: detail.summary || '',
            url: 'https://osv.dev/vulnerability/' + vuln.id })
        }
        if (item.next_page_token) next.push({ ...pending[i], page_token: item.next_page_token })
      }
      pending = next
    }
  }
  }
  await Promise.all(Array.from({ length: 3 }, worker))
  return { schema: 1, generatedAt: new Date().toISOString(), packageVersions: packages.length,
    findings: [...new Map(findings.map(f => [f.name + '@' + f.version + ':' + f.id, f])).values()] }
}
async function main() {
  const report = await audit(fs.readFileSync('yarn.lock', 'utf8'))
  fs.mkdirSync('.perf', { recursive: true })
  fs.writeFileSync('.perf/full-dependency-audit.json', JSON.stringify(report, null, 2) + '\n')
  const severe = report.findings.filter(f => ['HIGH', 'CRITICAL', 'UNKNOWN'].includes(f.severity))
  console.log(`Full lockfile audit: ${report.packageVersions} package versions; ${report.findings.length} package/advisory findings; ${severe.length} high/critical/unknown.`)
  for (const f of report.findings) console.log(`${f.severity} ${f.name}@${f.version} ${f.id}`)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `\n### Full dependency audit\nChecked ${report.packageVersions} locked package versions. ${report.findings.length} package/advisory findings; ${severe.length} require review.\n` +
    report.findings.map(f => `- ${f.severity}: ${f.name}@${f.version} — [${f.id}](${f.url})`).join('\n') + '\n')
  if (severe.length) process.exitCode = 1
}
module.exports = { audit }
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1 })
