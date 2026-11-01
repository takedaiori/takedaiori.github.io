'use strict'
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
  // API failures fail the check; an unavailable graph is not a clean scan.
  const { data } = await github.request('GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}', {
    ...context.repo, basehead: `${pr.base.sha}...${pr.head.sha}`
  })
  if (!Array.isArray(data) || !data.length) throw Error('Dependency diff is not ready or empty; retry after the graph is updated, or review the manifest-only change explicitly.')
  const risky = riskyChanges(data)
  await core.summary.addHeading('Dependency review').addRaw(`${data.length} dependency changes; ${risky.length} added high/critical vulnerability findings.`).write()
  for (const issue of risky) core.error(`${issue.name}@${issue.version}: ${issue.severity} ${issue.advisory}`)
  if (risky.length) core.setFailed('New high/critical dependency vulnerabilities require review.')
}
module.exports.riskyChanges = riskyChanges
