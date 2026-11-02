/** @jest-environment node */
const { compareLocks } = require('../../scripts/maintenance/dependency-lock-diff.cjs')
const one = 'one@^1:\n  version "1.0.0"\n  resolved "https://registry.npmjs.org/one/-/one-1.0.0.tgz"\n  integrity sha512-original\n'
const two = 'two@^1:\n  version "1.0.0"\n  resolved "https://registry.npmjs.org/two/-/two-1.0.0.tgz"\n  integrity sha512-original\n'
test('proves complete removals but refuses version, integrity or script changes', () => {
  const base = { dependencies: { one: '^1', two: '^1' }, scripts: { build: 'safe' } }
  const head = { dependencies: { one: '^1' }, scripts: { build: 'safe' } }
  expect(compareLocks(base, head, one + '\n' + two, one)).toMatchObject({ removalOnly: true, added: [], removedEntries: 1 })
  expect(compareLocks(base, head, one + '\n' + two, one.replace('sha512-original', 'sha512-changed')).removalOnly).toBe(false)
  expect(compareLocks(base, { ...head, scripts: { build: 'changed' } }, one + '\n' + two, one).removalOnly).toBe(false)
  const changed = compareLocks(base, head, one + '\n' + two, one.replace('version "1.0.0"', 'version "1.1.0"'))
  expect(changed.removalOnly).toBe(false)
  expect(changed.added).toEqual([{ name: 'one', version: '1.1.0' }])
})

test('OSV fallback cannot treat arbitrary git sources as registry packages', () => {
  const result = compareLocks({ dependencies: {} }, { dependencies: { one: '^1' } }, two,
    one.replace('https://registry.npmjs.org/one/-/one-1.0.0.tgz', 'https://example.test/arbitrary.tgz'))
  expect(result.unverifiedAdded).toEqual(['one'])
})

const review = require('../../scripts/maintenance/dependency-review.cjs')
function fixture(removal = false) {
  const baseManifest = { dependencies: { one: '^1', two: '^1' } }
  const headManifest = removal ? { dependencies: { one: '^1' } } : { dependencies: { one: '^1.1', two: '^1' } }
  const values = { base: { 'package.json': JSON.stringify(baseManifest), 'yarn.lock': one + '\n' + two }, head: { 'package.json': JSON.stringify(headManifest), 'yarn.lock': removal ? one : one.replaceAll('1.0.0', '1.1.0').replace('one@^1:', 'one@^1.1:') + '\n' + two } }
  const github = { paginate: jest.fn().mockResolvedValue([{ filename: 'package.json' }, { filename: 'yarn.lock' }]),
    rest: { pulls: { listFiles: jest.fn() }, repos: { getContent: jest.fn(async ({ ref, path }) => ({ data: { encoding: 'base64', content: Buffer.from(values[ref][path]).toString('base64') } })) } },
    request: jest.fn().mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 })) }
  const summary = { addHeading() { return this }, addRaw() { return this }, write: jest.fn().mockResolvedValue() }
  return { github, context: { repo: { owner: 'owner', repo: 'repo' }, payload: { pull_request: { number: 1, base: { sha: 'base' }, head: { sha: 'head' } } } }, core: { summary, warning: jest.fn(), error: jest.fn(), setFailed: jest.fn() } }
}
const originalFetch = global.fetch
afterEach(() => { global.fetch = originalFetch })
test('removal-only proof does not need a dependency graph or OSV response', async () => {
  const args = fixture(true)
  global.fetch = jest.fn()
  await review(args)
  expect(args.github.request).not.toHaveBeenCalled()
  expect(global.fetch).not.toHaveBeenCalled()
})
test('403 fallback queries exact added versions and blocks known advisories', async () => {
  const args = fixture()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [{ vulns: [{ id: 'GHSA-aaaa-bbbb-cccc' }] }] }) })
  await review(args)
  const body = JSON.parse(global.fetch.mock.calls[0][1].body)
  expect(body.queries).toEqual([{ package: { name: 'one', ecosystem: 'npm' }, version: '1.1.0' }])
  expect(args.core.setFailed).toHaveBeenCalled()
})
test('OSV failure cannot be reported as a clean scan', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 })
  await expect(review(fixture())).rejects.toThrow('OSV query failed: 503')
})

test('npm aliases are audited under the real package name, not the local alias', () => {
  const alias = 'one-cjs@npm:one@^1:\n  version "1.0.0"\n  resolved "https://registry.npmjs.org/one/-/one-1.0.0.tgz"\n'
  const result = compareLocks({ dependencies: {} }, { dependencies: { 'one-cjs': 'npm:one@^1' } }, two, alias)
  expect(result.added).toEqual([{ name: 'one', version: '1.0.0' }])
  expect(result.unverifiedAdded).toEqual([])
})

 test('fallback reports moderate findings while preserving the high/critical gate', async () => {
  const args = fixture()
  global.fetch = jest.fn(async url => ({ ok: true, json: async () => url.endsWith('querybatch')
    ? { results: [{ vulns: [{ id: 'GHSA-aaaa-bbbb-cccc' }] }] }
    : { database_specific: { severity: 'MODERATE' } } }))
  await review(args)
  expect(args.core.warning).toHaveBeenCalledWith(expect.stringContaining('MODERATE'))
  expect(args.core.setFailed).not.toHaveBeenCalled()
 })
