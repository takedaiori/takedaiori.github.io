/** @jest-environment node */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const { audit } = require('../../scripts/maintenance/site-artifact-audit.cjs')
const { riskyChanges } = require('../../scripts/maintenance/dependency-review.cjs')
let root
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-audit-')) })
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))
const put = (file, content) => { const p = path.join(root, file); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content) }
test('measures raw output, removed files and new script hosts against a baseline', () => {
  put('index.html', '<script src="https://static.cloudflareinsights.com/beacon.min.js"></script>')
  put('_next/static/app.js', 'public app')
  const first = audit(root, null)
  expect(first.findings).toEqual([])
  expect(first.deltaBytes).toBeNull()
  fs.unlinkSync(path.join(root, '_next/static/app.js'))
  put('index.html', '<script src="https://new.example/app.js"></script>')
  const second = audit(root, first)
  expect(second.deltaBytes).toBe(second.totalBytes - first.totalBytes)
  expect(second.changed.some(file => file.file === '_next/static/app.js' && file.delta < 0)).toBe(true)
  expect(second.newScriptHosts).toEqual(['new.example'])
})
test('blocks credentials and private build files without logging matched text', () => {
  const secret = 'test-only-' + 'z'.repeat(50)
  put('index.html', secret)
  put('.env.production', 'PRIVATE=value')
  const report = path.join(root, 'reports')
  const run = spawnSync(process.execPath, ['scripts/maintenance/site-artifact-audit.cjs'], { encoding: 'utf8', env: { ...process.env,
    SITE_AUDIT_DIR: root, SITE_AUDIT_REPORT_DIR: report, SCAN_SECRET_TEST: secret } })
  expect(run.status).toBe(1)
  expect(run.stderr).toContain('configured-secret')
  expect(run.stderr + run.stdout + fs.readFileSync(path.join(report, 'site-audit-report.json'), 'utf8')).not.toContain(secret)
})
test('dependency review blocks added high/critical issues but not removals or moderate findings', () => {
  expect(riskyChanges([
    { change_type: 'removed', name: 'old', vulnerabilities: [{ severity: 'critical' }] },
    { change_type: 'added', name: 'new', version: '1', vulnerabilities: [{ severity: 'high', advisory_ghsa_id: 'GHSA-example' }, { severity: 'moderate' }] }
  ])).toEqual([{ name: 'new', version: '1', severity: 'high', advisory: 'GHSA-example' }])
})


test('recognizes private keys serialized with JSON newline escapes', () => {
  const key = '-----BEGIN ' + 'PRIVATE KEY-----\n' + 'A'.repeat(80) + '\n-----END PRIVATE KEY-----'
  put('data.json', JSON.stringify({ key }))
  expect(audit(root, null).findings).toEqual([{ file: 'data.json', rule: 'private-key' }])
})


test('redacts credential-bearing filenames from both findings and size inventory', () => {
  const secret = 'fixture-' + 'q'.repeat(40)
  put(secret + '.html', 'Public content')
  const report = audit(root, null, [secret])
  expect(report.findings[0].rule).toBe('credential-in-path')
  expect(JSON.stringify(report)).not.toContain(secret)
})

test('scans htm credentials and protocol-relative external script hosts', () => {
  put('legacy.htm', '<script src="//cdn.example/versioned.js"></script>' + 'ghp_' + 'a'.repeat(36))
  const report = audit(root, null)
  expect(report.findings).toContainEqual({ file: 'legacy.htm', rule: 'github-token' })
  expect(report.scriptHosts).toContain('cdn.example')
})

test('blocks mutable CDN scripts and executable iframe URLs, preserving pinned CDN imports', () => {
  put('legacy.htm', '<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script><iframe src="javascript:alert(1)"></iframe>')
  expect(audit(root, null).findings.map(f => f.rule)).toEqual(['unpinned-cdn-script', 'executable-resource-url'])
  put('legacy.htm', '<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.js"></script>')
  expect(audit(root, null).findings).toEqual([])
})
