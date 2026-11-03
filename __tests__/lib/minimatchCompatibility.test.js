/** @jest-environment node */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { patch } = require('../../scripts/maintenance/patch-minimatch.cjs')
const baseline = require('../fixtures/minimatch-tooling-baseline.json')
const matcher = require('minimatch')
let fixture
beforeAll(() => {
  fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'minimatch-tooling-'))
  for (const file of baseline.files) {
    fs.mkdirSync(path.dirname(path.join(fixture, file)), { recursive: true })
    fs.writeFileSync(path.join(fixture, file), '')
  }
})
afterAll(() => fs.rmSync(fixture, { recursive: true, force: true }))
test('fixed engine supports callable CommonJS and modern named exports', () => {
  expect(require('minimatch/package.json').version).toBe('11.0.4')
  expect(typeof matcher).toBe('function')
  expect(matcher('src/a.js', '{src,test}/**/*.js')).toBe(true)
  expect(matcher('docs/a.md', '{src,test}/**/*.js')).toBe(false)
  expect(matcher.minimatch('src/a.js', '**/*.js')).toBe(true)
  expect(new matcher.Minimatch('{src,test}/**/*.ts', { optimizationLevel: 2 }).match('src/deep/file.ts')).toBe(true)
})
test('both TypeScript parser chains resolve the same fixed engine', () => {
  for (const owner of ['@typescript-eslint/parser', 'eslint-config-next']) {
    const directory = path.dirname(require.resolve(`${owner}/package.json`))
    const estree = path.dirname(require.resolve('@typescript-eslint/typescript-estree/package.json', { paths: [directory] }))
    expect(require(require.resolve('minimatch/package.json', { paths: [estree] })).version).toBe('11.0.4')
    expect(require(require.resolve('minimatch', { paths: [estree] })).minimatch('docs/a.md', '{src,test}/**/*.ts')).toBe(false)
  }
})
test('legacy glob preserves baseline file selection including hidden and nested files', () => {
  const glob = require('glob')
  for (const [pattern, expected] of Object.entries(baseline.paths)) {
    expect(glob.sync(pattern, { cwd: fixture, nodir: true, ignore: '**/node_modules/**' }).sort()).toEqual(expected)
  }
})
test('coverage inclusion and exclusion preserve the old toolchain decisions', () => {
  const TestExclude = require('test-exclude')
  const ex = new TestExclude({ cwd: fixture })
  expect(baseline.files.filter(file => ex.shouldInstrument(path.join(fixture, file))).sort()).toEqual(baseline.coverage)
})
test('compatibility patch is idempotent and fails closed on unknown code or version', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'minimatch-compat-'))
  try {
    fs.cpSync(path.dirname(require.resolve('minimatch/package.json')), directory, { recursive: true })
    expect(() => patch(directory)).not.toThrow()
    const manifest = require('../../patches/minimatch-compatibility.json')
    fs.appendFileSync(path.join(directory, manifest.file), '\n// changed upstream\n')
    expect(() => patch(directory)).toThrow('Unexpected minimatch source')
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ version: '99.0.0' }))
    expect(() => patch(directory)).toThrow('changed upstream version')
  } finally { fs.rmSync(directory, { recursive: true, force: true }) }
})

test('native ESM named imports remain usable', () => {
  const result = execFileSync(process.execPath, ['--input-type=module', '-e', "import { minimatch, Minimatch } from 'minimatch'; if (!minimatch('src/a.js', '**/*.js') || !new Minimatch('**/*.ts').match('src/a.ts')) process.exit(1)"], { cwd: process.cwd(), encoding: 'utf8' })
  expect(result).toBe('')
})
test('no installed package retains minimatch older than the fixed release', () => {
  const versions = []
  function scan(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const child = path.join(directory, entry.name)
      if (entry.name.startsWith('@')) { scan(child); continue }
      if (entry.name === 'minimatch') versions.push(JSON.parse(fs.readFileSync(path.join(child, 'package.json'), 'utf8')).version)
      if (fs.existsSync(path.join(child, 'node_modules'))) scan(path.join(child, 'node_modules'))
    }
  }
  scan(path.join(process.cwd(), 'node_modules'))
  expect(versions.length).toBeGreaterThan(0)
  expect(new Set(versions)).toEqual(new Set(['11.0.4']))
})
test('legacy async glob and Next lint glob preserve the file selection', async () => {
  const pattern = '{lib,components}/**/*.{js,cjs}'
  const glob = require('glob')
  const files = await new Promise((resolve, reject) => glob(pattern, { cwd: fixture, nodir: true, ignore: '**/node_modules/**' }, (error, files) => error ? reject(error) : resolve(files)))
  expect(files.sort()).toEqual(baseline.paths[pattern])
  const next = path.dirname(require.resolve('@next/eslint-plugin-next/package.json'))
  const nextGlob = require(require.resolve('glob', { paths: [next] }))
  expect(nextGlob.sync(pattern, { cwd: fixture, nodir: true, ignore: '**/node_modules/**' }).sort()).toEqual(baseline.paths[pattern])
})
test('glob adaptation is idempotent and rejects unknown files', () => {
  const { patchGlob } = require('../../scripts/maintenance/patch-minimatch.cjs')
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'glob-compat-'))
  try {
    fs.cpSync(path.dirname(require.resolve('glob/package.json')), directory, { recursive: true })
    expect(() => patchGlob(directory)).not.toThrow()
    fs.appendFileSync(path.join(directory, 'sync.js'), '\n// unknown change\n')
    expect(() => patchGlob(directory)).toThrow('Unexpected glob source')
  } finally { fs.rmSync(directory, { recursive: true, force: true }) }
})
