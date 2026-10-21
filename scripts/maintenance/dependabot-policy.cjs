'use strict'
const assert = require('node:assert/strict')
const allowed = new Set(['@testing-library/user-event', 'eslint-plugin-prettier'])
function patchOnly(before, after) {
  const parse = s => /^[~^]?(\d+)\.(\d+)\.(\d+)$/.exec(s || '')
  const a = parse(before), b = parse(after)
  return !!(a && b && a[1] === b[1] && a[2] === b[2] && +b[3] > +a[3] && before[0] === after[0])
}
function canAutoMerge(base, head) {
  const copy = JSON.parse(JSON.stringify(head))
  const names = new Set([...Object.keys(base.devDependencies || {}), ...Object.keys(head.devDependencies || {})])
  const changed = [...names].filter(n => base.devDependencies?.[n] !== head.devDependencies?.[n])
  if (!changed.length || changed.some(n => !allowed.has(n) || !patchOnly(base.devDependencies?.[n], head.devDependencies?.[n]))) return false
  for (const n of changed) copy.devDependencies[n] = base.devDependencies[n]
  // Reject any other manifest change, including scripts, resolutions and production dependencies.
  return JSON.stringify(copy) === JSON.stringify(base)
}
module.exports = { canAutoMerge }
if (require.main === module) {
  const base = { scripts: { build: 'safe' }, dependencies: { next: '^15.5.28' }, devDependencies: { '@testing-library/user-event': '^14.6.7' } }
  const changed = () => { const h = structuredClone(base); h.devDependencies['@testing-library/user-event'] = '^14.6.8'; return h }
  assert.equal(canAutoMerge(base, changed()), true)
  const minor = changed(); minor.devDependencies['@testing-library/user-event'] = '^14.7.0'; assert.equal(canAutoMerge(base, minor), false)
  const script = changed(); script.scripts.build = 'unsafe'; assert.equal(canAutoMerge(base, script), false)
  const prod = changed(); prod.dependencies.next = '^15.5.29'; assert.equal(canAutoMerge(base, prod), false)
  const added = changed(); added.devDependencies.ai = '^7.1.0'; assert.equal(canAutoMerge(base, added), false)
  assert.equal(canAutoMerge(base, base), false)
  console.log('Dependency policy: 6 cases passed')
}
