'use strict'
// Only trust a report from a successful deployment workflow on main.
module.exports = async ({ github, context, core }) => {
  const fs = require('node:fs')
  const { data } = await github.rest.actions.listWorkflowRuns({ ...context.repo,
    workflow_id: 'deploy-pages.yml', branch: 'main', status: 'success', per_page: 20 })
  fs.mkdirSync('.perf', { recursive: true })
  for (const run of data.workflow_runs) {
    if (run.id === context.runId) continue
    const { data: artifacts } = await github.rest.actions.listWorkflowRunArtifacts({ ...context.repo, run_id: run.id, per_page: 100 })
    const artifact = artifacts.artifacts.find(item => item.name === 'site-audit-report' && !item.expired)
    if (!artifact) continue
    const archive = await github.rest.actions.downloadArtifact({ ...context.repo, artifact_id: artifact.id, archive_format: 'zip' })
    fs.writeFileSync('.perf/baseline.zip', Buffer.from(archive.data))
    core.notice(`Size baseline: successful main workflow ${run.id} (${run.head_sha})`)
    return
  }
  core.notice('No previous successful size report; first run will establish a baseline.')
}
