'use strict'
// Parser change from micromatch/picomatch#262, pinned to 3222059ac27492d9c0147fee5c65f751bbd851ab.
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')

const sucrase = path.dirname(require.resolve('sucrase/package.json'))
const metadata = require.resolve('picomatch/package.json', { paths: [sucrase] })
if (require(metadata).version !== '4.0.7') throw Error('Review Picomatch #262 for the new Sucrase dependency version')
const target = path.join(path.dirname(metadata), 'lib/parse.js')
const digest = source => crypto.createHash('sha256').update(source).digest('hex')
const source = fs.readFileSync(target)
const original = '4e1e05447668aa1e94366c5516a2bcd8f5fff800cc92b1d0cd7d77703b8618c4'
const patched = 'ba3ceada5df0d77ae7eda03820aed62aa07f564c921e9490368799b96762f007'

if (digest(source) !== patched) {
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
console.log('Verified upstream Picomatch #262 parser patch for Sucrase')
