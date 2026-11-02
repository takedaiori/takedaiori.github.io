/** @jest-environment node */
const { audit } = require('../../scripts/maintenance/full-dependency-audit.cjs')
const lock = 'example@^1.0.0:\n  version "1.0.0"\n'
describe('whole-lock vulnerability coverage', () => {
  test('collects vulnerabilities and pagination together', async () => {
    let pages = 0
    const query = async url => {
      if (!url.endsWith('querybatch')) return { database_specific: { severity: 'HIGH' } }
      return ++pages === 1
        ? { results: [{ vulns: [{ id: 'GHSA-aaaa-bbbb-cccc' }], next_page_token: 'next' }] }
        : { results: [{ vulns: [{ id: 'GHSA-dddd-eeee-ffff' }] }] }
    }
    const result = await audit(lock, query)
    expect(result.findings).toHaveLength(2)
    expect(pages).toBe(2)
  })
  test('does not report success on partial coverage or service failure', async () => {
    await expect(audit(lock, async () => ({ results: [] }))).rejects.toThrow('Incomplete')
    await expect(audit(lock, async () => { throw Error('offline') })).rejects.toThrow('offline')
  })
})
