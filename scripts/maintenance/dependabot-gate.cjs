'use strict'
const { canAutoMerge } = require('./dependabot-policy.cjs')
module.exports = async ({ github, context, core }) => {
  const repo = context.repo
  let number = context.payload.inputs?.pr_number
  if (!number) {
    if (context.payload.workflow_run?.conclusion !== 'success') return
    const sha = context.payload.workflow_run.head_sha
    const { data } = await github.rest.repos.listPullRequestsAssociatedWithCommit({ ...repo, commit_sha: sha })
    number = data.find(p => p.state === 'open' && p.head.sha === sha)?.number
  }
  if (!number) return
  const { data: pr } = await github.rest.pulls.get({ ...repo, pull_number: Number(number) })
  if (pr.state !== 'open' || pr.draft || pr.user.login !== 'dependabot[bot]' || pr.head.repo.full_name !== context.payload.repository.full_name || pr.base.ref !== 'main') return
  const files = await github.paginate(github.rest.pulls.listFiles, { ...repo, pull_number: pr.number, per_page: 100 })
  if (!files.length || files.some(f => !['package.json', 'yarn.lock'].includes(f.filename))) return
  // Only accept successful checks produced by GitHub Actions on this exact head.
  const runs = await github.paginate(github.rest.checks.listForRef, { ...repo, ref: pr.head.sha, per_page: 100 })
  const required = ['Lint & type-check', 'Unit tests', 'Lockfile consistency', 'Analyze (javascript-typescript)']
  for (const name of required) {
    const check = runs.filter(c => c.name === name && c.app?.slug === 'github-actions').sort((a,b) => b.id-a.id)[0]
    if (check?.conclusion !== 'success') { core.notice(`Waiting for ${name}`); return }
  }
  const manifest = async ref => {
    const { data } = await github.rest.repos.getContent({ ...repo, path: 'package.json', ref })
    return JSON.parse(Buffer.from(data.content, 'base64').toString())
  }
  const base = await manifest(pr.base.sha), head = await manifest(pr.head.sha)
  core.setOutput('eligible', 'true')
  core.setOutput('sha', pr.head.sha)
  core.setOutput('pr', String(pr.number))
  core.setOutput('auto', String(canAutoMerge(base, head)))
  await core.summary.addHeading(`Dependency PR #${pr.number}`).addRaw(canAutoMerge(base, head) ? 'Allowlisted patch: merge only after full export succeeds.' : 'Full export only. Human review remains required.').write()
}
