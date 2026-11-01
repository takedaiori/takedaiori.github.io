'use strict'
const canonical = value => JSON.stringify(value, (key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item)
function lockEntries(text) {
  const blocks = []; let current = []
  for (const line of text.split('\n')) {
    if (line && !/^[\s#]/.test(line)) {
      if (!line.endsWith(':')) throw Error('Unsupported Yarn lockfile syntax')
      if (current.length) blocks.push(current.join('\n').trim())
      current = [line]
    } else if (current.length) current.push(line)
  }
  if (current.length) blocks.push(current.join('\n').trim())
  return blocks.map(block => {
    const match = /^(?:"([^"]+)"|([^,\s]+))/.exec(block)
    const selector = match?.[1] || match?.[2]
    const version = /^  version "([^"]+)"/m.exec(block)?.[1]
    if (!selector || !version || !selector.includes('@')) throw Error('Unsupported dependency entry')
    const requestedName = selector.slice(0, selector.lastIndexOf('@'))
    const name = requestedName.includes('@npm:') ? requestedName.slice(requestedName.indexOf('@npm:') + 5) : requestedName
    return { name, version, block }
  })
}
function compareLocks(baseManifest, headManifest, baseLock, headLock) {
  const base = lockEntries(baseLock), head = lockEntries(headLock)
  const cleaned = JSON.parse(JSON.stringify(baseManifest))
  for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const name of Object.keys(cleaned[group] || {})) if (!Object.hasOwn(headManifest[group] || {}, name)) delete cleaned[group][name]
  }
  const originalBlocks = new Set(base.map(entry => entry.block))
  const removalOnly = canonical(cleaned) === canonical(headManifest) && head.every(entry => originalBlocks.has(entry.block))
  const originalVersions = new Set(base.map(entry => entry.name + '@' + entry.version))
  const added = [...new Map(head.filter(entry => !originalVersions.has(entry.name + '@' + entry.version))
    .map(entry => [entry.name + '@' + entry.version, { name: entry.name, version: entry.version }])).values()]
  const unverifiedAdded = head.filter(entry => !originalVersions.has(entry.name + '@' + entry.version) && (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(entry.name) || !/^  resolved "https:\/\/registry\.(?:npmjs\.org|yarnpkg\.com|npmmirror\.com)\//m.test(entry.block))).map(entry => entry.name)
  return { removalOnly, added, unverifiedAdded, removedEntries: base.length - head.length }
}
module.exports = { lockEntries, compareLocks }
