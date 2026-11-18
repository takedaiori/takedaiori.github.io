'use strict'
// Parser change from micromatch/picomatch#262, pinned to 3222059ac27492d9c0147fee5c65f751bbd851ab.
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')

function findParsers(modules, targets) {
  if (!fs.existsSync(modules)) return
  for (const entry of fs.readdirSync(modules, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const directory = path.join(modules, entry.name)
    if (entry.name.startsWith('@')) {
      findParsers(directory, targets)
      continue
    }
    if (entry.name === 'picomatch') {
      const { version } = require(path.join(directory, 'package.json'))
      if (version === '4.0.7') targets.add(path.join(directory, 'lib/parse.js'))
    }
    findParsers(path.join(directory, 'node_modules'), targets)
  }
}
const digest = source => crypto.createHash('sha256').update(source).digest('hex')
const original = '4e1e05447668aa1e94366c5516a2bcd8f5fff800cc92b1d0cd7d77703b8618c4'
const patched = 'ba3ceada5df0d77ae7eda03820aed62aa07f564c921e9490368799b96762f007'

function patchParser(target) {
  const source = fs.readFileSync(target)
  if (digest(source) === patched) return
  if (digest(source) !== original) throw Error('Unexpected Picomatch 4.0.7 parser source')
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'picomatch-262-'))
  try {
    const parser = path.join(directory, 'lib/parse.js')
    fs.mkdirSync(path.dirname(parser))
    fs.writeFileSync(parser, source)
    const patch = path.resolve(__dirname, '../../patches/picomatch-262.patch')
    execFileSync('git', ['apply', patch], { cwd: directory })
    const result = fs.readFileSync(parser)
    if (digest(result) !== patched) throw Error('Unexpected Picomatch #262 patch result')
    fs.writeFileSync(target, result)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

const targets = new Set()
findParsers(path.resolve(__dirname, '../../node_modules'), targets)
if (!targets.size) throw Error('Picomatch 4.0.7 was not found in the installed dependencies')
for (const target of targets) patchParser(target)
console.log(`Verified upstream Picomatch #262 parser patch for ${targets.size} installed Picomatch 4.0.7 copies`)
