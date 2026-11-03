'use strict'
// Compatibility only: keep the fixed 11.x matching engine and its ESM exports.
// Old build tools require a callable CommonJS export. No 3.x implementation is retained.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const manifest = require('../../patches/minimatch-compatibility.json')
const digest = value => crypto.createHash('sha256').update(value).digest('hex')
const suffix = '\n// Blog build-tool CommonJS compatibility; matching remains upstream minimatch 11.\nmodule.exports = Object.assign(function minimatchCompat(...args) { return exports.minimatch(...args) }, exports);\n'
function patch(directory) {
  const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'))
  if (metadata.version !== manifest.version) throw Error('Review minimatch compatibility for changed upstream version')
  const file = path.join(directory, manifest.file)
  const source = fs.readFileSync(file, 'utf8')
  if (digest(source) === manifest.patched) return
  if (digest(source) !== manifest.original || digest(source + suffix) !== manifest.patched) throw Error('Unexpected minimatch source')
  fs.writeFileSync(file, source + suffix)
}
function patchGlob(directory) {
  const version = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')).version
  const entries = require('../../patches/glob-minimatch-compatibility.json').filter(entry => entry.version === version)
  if (entries.length !== 2) throw Error('Review glob compatibility for changed upstream version')
  for (const entry of entries) {
    const file = path.join(directory, entry.file)
    const source = fs.readFileSync(file, 'utf8')
    if (digest(source) === entry.patched) continue
    const fixed = source.replace('var rawGlob = pn._glob', 'var rawGlob = pn._glob || pn.pattern').replaceAll('e.match(pn)', 'pn.test(e)').replace("isAbsolute(pattern.join('/'))", "isAbsolute(pattern.map(function (p) { return p === minimatch.GLOBSTAR ? '**' : p }).join('/'))")
    if (digest(source) !== entry.original || digest(fixed) !== entry.patched) throw Error('Unexpected glob source')
    fs.writeFileSync(file, fixed)
  }
}
function patchInstalled() {
  patch(path.dirname(require.resolve('minimatch/package.json')))
  const directories = new Set([path.dirname(require.resolve('glob/package.json'))])
  const next = path.dirname(require.resolve('@next/eslint-plugin-next/package.json'))
  directories.add(path.dirname(require.resolve('glob/package.json', { paths: [next] })))
  for (const directory of directories) patchGlob(directory)
}
module.exports = { patch, patchGlob }
if (require.main === module) {
  try { patchInstalled(); console.log('Verified minimatch 11 CommonJS compatibility') }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
