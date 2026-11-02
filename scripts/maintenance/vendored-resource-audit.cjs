'use strict'
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
function verify(manifest, root = '.') {
  if (manifest.schema !== 1) throw Error('Unsupported vendor inventory')
  for (const item of manifest.local) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, item.path))).digest('hex')
    if (hash !== item.sha256) throw Error(`Vendored resource changed without a fresh review: ${item.path}`)
  }
  for (const item of manifest.remote) {
    const source = fs.readFileSync(path.join(root, item.loader), 'utf8')
    if (!source.includes(item.url) || !source.includes(item.integrity)) throw Error('Pinned remote integrity is missing')
  }
}
async function advisories(manifest, request = fetch) {
  const entries = [...manifest.local, ...manifest.remote]
  let pending = entries.map(item => ({ package: { name: item.package, ecosystem: 'npm' }, ...(item.queryAllVersions ? {} : { version: item.version }) }))
  const findings = []
  let rounds = 0
  while (pending.length) {
    if (++rounds > 20) throw Error('Vendor advisory pagination incomplete')
    const response = await request('https://api.osv.dev/v1/querybatch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ queries: pending }), signal: AbortSignal.timeout(30000)
    })
    if (!response.ok) throw Error(`Vendor advisory query failed: ${response.status}`)
    const result = await response.json()
    if (!Array.isArray(result.results) || result.results.length !== pending.length) throw Error('Incomplete vendor advisory response')
    const next = []
    result.results.forEach((item, i) => {
      for (const issue of item.vulns || []) findings.push({ package: pending[i].package.name, version: pending[i].version || 'all versions', id: issue.id })
      if (item.next_page_token) next.push({ ...pending[i], page_token: item.next_page_token })
    })
    pending = next
  }
  return findings
}
async function main() {
  const manifest = JSON.parse(fs.readFileSync('vendored-resources.json', 'utf8'))
  verify(manifest)
  if (process.argv.includes('--offline')) { console.log('Vendored integrity checks passed'); return }
  const findings = await advisories(manifest)
  fs.mkdirSync('.perf', { recursive: true })
  fs.writeFileSync('.perf/vendored-resource-audit.json', JSON.stringify({ generatedAt: new Date().toISOString(), packages: manifest.local.length + manifest.remote.length, findings }, null, 2) + '\n')
  console.log(`Vendored resource audit: ${manifest.local.length + manifest.remote.length} package queries; ${findings.length} advisory findings`)
  if (findings.length) { console.error(JSON.stringify(findings)); process.exitCode = 1 }
}
module.exports = { verify, advisories }
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1 })
