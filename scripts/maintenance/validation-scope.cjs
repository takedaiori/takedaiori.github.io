'use strict'
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
function requiresSiteValidation(paths) {
  const rootDocs = new Set(['README.md', 'NotionNext-GitHub-Pages-Guide.md', 'CONTENT-RIGHTS.md', 'LICENSE', 'LICENSE.txt'])
  return paths.some(p => !p.startsWith('docs/') && !rootDocs.has(p))
}
function versionOnlyManifestChange(base, head) {
  const stripVersions = value => {
    const copy = structuredClone(value)
    for (const key of ['dependencies', 'devDependencies']) copy[key] = Object.keys(copy[key] || {}).sort()
    return copy
  }
  return JSON.stringify(stripVersions(base)) === JSON.stringify(stripVersions(head))
}
module.exports = { requiresSiteValidation, versionOnlyManifestChange }
if (require.main === module) {
  for (const key of ['BASE_SHA', 'HEAD_SHA']) if (!/^[a-f0-9]{40}$/.test(process.env[key] || '')) throw Error('Invalid source revision')
  const paths = execFileSync('git', ['diff', '--no-renames', '--name-only', '-z', process.env.BASE_SHA, process.env.HEAD_SHA], { encoding: 'utf8' }).split('\0').filter(Boolean)
  const manifest = ref => JSON.parse(execFileSync('git', ['show', `${ref}:package.json`], { encoding: 'utf8' }))
  const base = manifest(process.env.BASE_SHA), head = manifest(process.env.HEAD_SHA)
  const dependencyOnly = paths.length > 0 && paths.every(p => ['package.json', 'yarn.lock'].includes(p)) && versionOnlyManifestChange(base, head)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `required=${requiresSiteValidation(paths)}\ndependency_only=${dependencyOnly}\n`)
}
