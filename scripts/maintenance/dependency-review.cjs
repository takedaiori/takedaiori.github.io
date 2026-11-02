'use strict'
const { compareLocks } = require('./dependency-lock-diff.cjs')
function riskyChanges(changes) {
  return changes.filter(change => change.change_type === 'added').flatMap(change =>
    (change.vulnerabilities || []).filter(issue => ['high', 'critical'].includes(issue.severity))
      .map(issue => ({ name: change.name, version: change.version, severity: issue.severity, advisory: issue.advisory_ghsa_id }))
  )
}
module.exports = async ({ github, context, core }) => {
  const pr = context.payload.pull_request
  if (!pr) throw Error('Dependency review requires a pull request event')
  const files = await github.paginate(github.rest.pulls.listFiles, { ...context.repo, pull_number: pr.number, per_page: 100 })
  if (!files.some(file => ['package.json', 'yarn.lock'].includes(file.filename))) {
    await core.summary.addHeading('Dependency review').addRaw('No dependency manifest or lockfile changes.').write()
    return
  }
  const content = async (ref, path) => {
    const { data } = await github.rest.repos.getContent({ ...context.repo, ref, path })
    if (data.encoding !== 'base64') throw Error('Cannot read complete dependency metadata')
    return Buffer.from(data.content, 'base64').toString('utf8')
  }
  const [baseManifest, headManifest, baseLock, headLock] = await Promise.all([
    content(pr.base.sha, 'package.json'), content(pr.head.sha, 'package.json'),
    content(pr.base.sha, 'yarn.lock'), content(pr.head.sha, 'yarn.lock')
  ])
  const comparison = compareLocks(JSON.parse(baseManifest), JSON.parse(headManifest), baseLock, headLock)
  if (comparison.removalOnly) {
    await core.summary.addHeading('Dependency review').addRaw(`Verified removal-only dependency change: retained lock entries unchanged; ${comparison.removedEntries} entries removed. No new package version introduced.`).write()
    return
  }
  let data
  try {
    const response = await github.request('GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}', {
      ...context.repo, basehead: `${pr.base.sha}...${pr.head.sha}`
    })
    data = response.data
    if (!Array.isArray(data) || !data.length) throw Error('Dependency diff is not ready')
  } catch (error) {
    core.warning(`GitHub dependency graph unavailable (${error.status || 'not ready'}); checking added locked npm versions with OSV.`)
    if (comparison.unverifiedAdded.length) throw Error('Non-registry dependencies require manual source review.')
    if (!comparison.added.length) throw Error('Lock sources or metadata changed without a new version; manual review required.')
    let pending = comparison.added.map(item => ({ package: { name: item.name, ecosystem: 'npm' }, version: item.version }))
    let findings = 0, rounds = 0
    while (pending.length) {
      if (++rounds > 20) throw Error('OSV pagination did not complete')
      const queries = pending.splice(0, 50)
      const response = await fetch('https://api.osv.dev/v1/querybatch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }), signal: AbortSignal.timeout(30000)
      })
      if (!response.ok) throw Error(`OSV query failed: ${response.status}`)
      const result = await response.json()
      if (!Array.isArray(result.results) || result.results.length !== queries.length) throw Error('Incomplete OSV response')
      for (const [index, item] of result.results.entries()) {
        for (const issue of item.vulns || []) {
          if (!/^GHSA-[a-z0-9-]+$|^CVE-\d{4}-\d+$/.test(issue.id)) throw Error('Unexpected advisory identifier')
          const detailResponse = await fetch('https://api.osv.dev/v1/vulns/' + issue.id, { signal: AbortSignal.timeout(30000) })
          if (!detailResponse.ok) throw Error('OSV advisory details unavailable')
          const detail = await detailResponse.json()
          if (detail.withdrawn) continue
          const severity = detail.database_specific?.severity || 'UNKNOWN'
          const message = `${queries[index].package.name}@${queries[index].version}: ${severity} ${issue.id}`
          if (['HIGH', 'CRITICAL', 'UNKNOWN'].includes(severity)) {
            findings++
            core.error(message)
          } else core.warning(message)
        }
        if (item.next_page_token) pending.push({ ...queries[index], page_token: item.next_page_token })
      }
    }
    await core.summary.addHeading('Dependency review: OSV fallback').addRaw(`${comparison.added.length} added locked npm versions checked; ${findings} advisory findings. Fallback blocks high/critical advisories and unknown severity; moderate/low findings remain visible.`).write()
    if (findings) core.setFailed('Added high/critical or unclassified dependency advisories found by OSV fallback.')
    return
  }
  const risky = riskyChanges(data)
  await core.summary.addHeading('Dependency review').addRaw(`${data.length} dependency changes; ${risky.length} added high/critical vulnerability findings.`).write()
  for (const issue of risky) core.error(`${issue.name}@${issue.version}: ${issue.severity} ${issue.advisory}`)
  if (risky.length) core.setFailed('New high/critical dependency vulnerabilities require review.')
}
module.exports.riskyChanges = riskyChanges
