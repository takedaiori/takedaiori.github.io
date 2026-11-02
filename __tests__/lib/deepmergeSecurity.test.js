/** @jest-environment node */
const fs = require('node:fs'), os = require('node:os'), path = require('node:path')
const { patch } = require('../../scripts/maintenance/patch-deepmerge.cjs')
let directory, merge
beforeAll(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'deepmerge-security-'))
  fs.cpSync(path.dirname(require.resolve('deepmerge/package.json')), directory, { recursive: true })
  patch(directory)
  merge = require(path.join(directory, 'dist/cjs.js'))
})
afterAll(() => fs.rmSync(directory, { recursive: true, force: true }))
test('Jest resolves the exact deepmerge instance covered by the install patch', () => {
  const jestConfig = path.dirname(require.resolve('jest-config/package.json'))
  expect(require.resolve('deepmerge', { paths: [jestConfig] })).toBe(require.resolve('deepmerge'))
})
test('target-side __proto__ stays an inert own property, including null-prototype inputs', () => {
  for (const input of [JSON.parse('{"__proto__":{"injected":true},"safe":1}'), Object.assign(Object.create(null), JSON.parse('{"__proto__":{"injected":true}}'))]) {
    const result = merge(input, {})
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result.injected).toBeUndefined()
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
  }
  expect({}.injected).toBeUndefined()
})
test('normal Jest globals, arrays, symbols and custom merges retain their behavior', () => {
  const symbol = Symbol('setting')
  const first = { nested: { a: 1 }, values: [1], [symbol]: 7 }
  expect(merge(first, { nested: { b: 2 }, values: [2] })).toEqual({ nested: { a: 1, b: 2 }, values: [1, 2], [symbol]: 7 })
  expect(first.nested).toEqual({ a: 1 })
  expect(merge({ values: [1] }, { values: [2] }, { arrayMerge: (_, source) => source })).toEqual({ values: [2] })
  expect(merge({ number: { value: 1 } }, { number: { value: 2 } }, { customMerge: key => key === 'number' ? (a, b) => ({ value: a.value + b.value }) : undefined })).toEqual({ number: { value: 3 } })
})
test('patch is idempotent and rejects unexpected source modifications', () => {
  expect(() => patch(directory)).not.toThrow()
  fs.appendFileSync(path.join(directory, 'index.js'), '\n// changed upstream\n')
  expect(() => patch(directory)).toThrow('Unexpected deepmerge source')
})
