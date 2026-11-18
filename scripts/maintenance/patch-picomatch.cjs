'use strict'
// Temporary local mitigation for GHSA-fc5q-39xc-vjpf.
// Wildcards inside repeating extglobs are rejected at parse time.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const versions = {
  "4.0.7": {
    "original": "4e1e05447668aa1e94366c5516a2bcd8f5fff800cc92b1d0cd7d77703b8618c4",
    "patched": "f671c2effc9036498b32f458732fa478b59d474cccdba3d7e101f010c45378c7"
  },
  "2.3.2": {
    "original": "3a91656f440069aa8f8e15c9d695b9f6b2209df1eab2be8127c72cbcca45ff5f",
    "patched": "cd755fb85d43124b78e53b8991a854d4b3a46022425ff3811411dcaa946b7733"
  }
}
const digest = source => crypto.createHash('sha256').update(source).digest('hex')
const original = "    const analysis = analyzeRepeatedExtglob(body, opts);"
const replacement = "    // Local mitigation for GHSA-fc5q-39xc-vjpf.\n    if ((token.type === 'plus' || token.type === 'star') && /[*?]/.test(body)) {\n      throw new SyntaxError('Wildcard inside a repeated extglob is disabled');\n    }\n    const analysis = analyzeRepeatedExtglob(body, opts);"

function installedCopies(directory) {
  const copies = []
  const pending = [path.join(directory, 'node_modules')]
  while (pending.length) {
    const modules = pending.pop()
    if (!fs.existsSync(modules)) continue
    for (const entry of fs.readdirSync(modules, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const folder = path.join(modules, entry.name)
      if (entry.name === 'picomatch') copies.push(folder)
      if (entry.name.startsWith('@')) {
        for (const name of fs.readdirSync(folder, { withFileTypes: true })) {
          if (name.isDirectory()) pending.push(path.join(folder, name.name, 'node_modules'))
        }
      } else {
        pending.push(path.join(folder, 'node_modules'))
      }
    }
  }
  return copies
}

function verifyInstalled({ apply = false } = {}) {
  const verified = new Set()
  for (const directory of installedCopies(path.resolve(__dirname, '../..'))) {
    const { version } = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'))
    const expected = versions[version]
    if (!expected) throw Error(`Review Picomatch mitigation for version ${version}`)
    const file = path.join(directory, 'lib/parse.js')
    const source = fs.readFileSync(file, 'utf8')
    if (digest(source) !== expected.patched) {
      if (!apply || digest(source) !== expected.original) throw Error(`Unexpected Picomatch source: ${file}`)
      const patched = source.replace(original, replacement)
      if (digest(patched) !== expected.patched) throw Error(`Unexpected Picomatch patch result: ${file}`)
      fs.writeFileSync(file, patched)
    }
    verified.add(version)
  }
  if (!verified.size) throw Error('No installed Picomatch copies were verified')
  return verified
}

module.exports = { verifyInstalled }
if (require.main === module) {
  const versions = verifyInstalled({ apply: true })
  console.log('Verified Picomatch mitigation for ' + [...versions].sort().join(', '))
}
