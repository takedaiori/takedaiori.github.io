/** @jest-environment node */
const { requiresSiteValidation, versionOnlyManifestChange } = require('../../scripts/maintenance/validation-scope.cjs')
test('only explicit documentation paths can skip a site build', () => {
  expect(requiresSiteValidation(['README.md', 'docs/security/report.md'])).toBe(false)
  for (const path of ['pages/test.js', 'docs-old/test.js', '.github/workflows/ci.yml', 'scripts/maintenance/tool.py', 'package.json', 'new-content.md', 'next.config.js']) {
    expect(requiresSiteValidation(['docs/security/report.md', path])).toBe(true)
  }
})

test('bot build eligibility rejects script/config/new-package changes before secrets are exposed', () => {
  const base = { scripts: { build: 'next build' }, dependencies: { next: '15.5.28' }, devDependencies: { jest: '29.7.0' } }
  const version = structuredClone(base); version.dependencies.next = '15.5.29'
  expect(versionOnlyManifestChange(base, version)).toBe(true)
  const script = structuredClone(version); script.scripts.build = 'unsafe'
  expect(versionOnlyManifestChange(base, script)).toBe(false)
  const added = structuredClone(version); added.dependencies.unknown = '1.0.0'
  expect(versionOnlyManifestChange(base, added)).toBe(false)
  const override = structuredClone(version); override.resolutions = { glob: '14' }
  expect(versionOnlyManifestChange(base, override)).toBe(false)
})
