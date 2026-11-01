'use strict'
module.exports = async ({ github, context }) => {
  const fs = require('node:fs')
  const { data } = await github.rest.actions.listWorkflowRuns({ ...context.repo, workflow_id: 'deploy-pages.yml', branch: 'main', status: 'success', per_page: 20 })
  for (const run of data.workflow_runs) {
    const { data: artifacts } = await github.rest.actions.listWorkflowRunArtifacts({ ...context.repo, run_id: run.id, per_page: 100 })
    const artifact = artifacts.artifacts.find(item => item.name === 'github-pages' && !item.expired)
    if (!artifact) continue
    const response = await github.rest.actions.downloadArtifact({ ...context.repo, artifact_id: artifact.id, archive_format: 'zip' })
    fs.mkdirSync('.tmp', { recursive: true })
    fs.writeFileSync('.tmp/pruning-baseline.zip', Buffer.from(response.data))
    console.log(`Published baseline: run ${run.id}, commit ${run.head_sha}`)
    return
  }
  throw Error('No unexpired successful Pages artifact exists; cannot claim before/after validation.')
}
