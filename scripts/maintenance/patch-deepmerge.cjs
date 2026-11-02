'use strict'
// Local mitigation for GHSA-gcqx-w48m-w2h4. Keep the upstream advisory visible.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const manifest = require('../../patches/deepmerge-security.json')
const digest = value => crypto.createHash('sha256').update(value).digest('hex')
function patch(directory) {
  if (JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')).version !== manifest.version) throw Error('Review deepmerge patch for changed upstream version')
  for (const entry of manifest.files) {
    const file = path.join(directory, entry.path)
    const source = fs.readFileSync(file, 'utf8')
    if (digest(source) === entry.patched) continue
    if (digest(source) !== entry.original) throw Error(`Unexpected deepmerge source: ${entry.path}`)
    // Define data properties explicitly: __proto__ must never invoke Object.prototype's setter.
    let replacements = 0
    const fixed = source.replace(/destination\[key\] = ([^;\n]+);?/g, (_, expression) => {
      replacements++
      return `Object.defineProperty(destination, key, { value: ${expression}, enumerable: true, configurable: true, writable: true });`
    })
    if (replacements !== 3 || digest(fixed) !== entry.patched) throw Error('Unexpected deepmerge patch result')
    fs.writeFileSync(file, fixed)
  }
}
module.exports = { patch }
if (require.main === module) {
  try { patch(path.dirname(require.resolve('deepmerge/package.json'))); console.log('Verified deepmerge prototype-poisoning mitigation') }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
