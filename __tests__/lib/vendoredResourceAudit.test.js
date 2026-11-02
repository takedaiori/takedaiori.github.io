/** @jest-environment node */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { verify, advisories } = require('../../scripts/maintenance/vendored-resource-audit.cjs')
test('a changed retained bundle cannot pass the recorded integrity review', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vendor-integrity-'))
  try {
    fs.writeFileSync(path.join(root, 'sample.js'), 'reviewed')
    const manifest = { schema: 1, local: [{ path: 'sample.js', sha256: crypto.createHash('sha256').update('reviewed').digest('hex') }], remote: [] }
    verify(manifest, root)
    const sourceOnly = { ...manifest, local: [], source: manifest.local }
    verify(sourceOnly, root)
    fs.writeFileSync(path.join(root, 'sample.js'), 'modified')
    expect(() => verify(manifest, root)).toThrow('fresh review')
    expect(() => verify(sourceOnly, root)).toThrow('fresh review')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
test('vendored advisories include pagination even when the same page already has a finding', async () => {
  let page = 0
  const request = jest.fn(async () => ({ ok: true, json: async () => ({ results: [++page === 1
    ? { vulns: [{ id: 'GHSA-first' }], next_page_token: 'next' }
    : { vulns: [{ id: 'GHSA-second' }] }] }) }))
  const manifest = { local: [{ package: 'example', version: '0.1.0', queryAllVersions: true }], remote: [] }
  expect(await advisories(manifest, request)).toHaveLength(2)
  expect(JSON.parse(request.mock.calls[0][1].body).queries[0]).not.toHaveProperty('version')
  await expect(advisories(manifest, async () => ({ ok: false, status: 503 }))).rejects.toThrow('503')
})
