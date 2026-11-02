/** @jest-environment node */
const fs = require('node:fs'), os = require('node:os'), path = require('node:path')
const { findings, check } = require('../../scripts/maintenance/codeql-result-gate.cjs')
const report = results => ({ version: '2.1.0', runs: [{ tool: { driver: { name: 'CodeQL' } }, results }] })
test('successful execution cannot hide findings or suppression-only bypasses', () => {
  expect(findings(report([]))).toBe(0)
  expect(findings(report([{ level: 'warning', ruleId: 'synthetic' }]))).toBe(1)
  expect(findings(report([{ level: 'warning', suppressions: [{ kind: 'inSource', status: 'accepted' }] }]))).toBe(1)
  expect(findings(report([{ kind: 'pass' }, { kind: 'notApplicable' }]))).toBe(0)
  const failed = report([]); failed.runs[0].invocations = [{ executionSuccessful: false }]
  expect(() => findings(failed)).toThrow('invocation failed')
})
test('missing and malformed result files cannot produce a green gate', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeql-gate-'))
  try {
    expect(() => check(root)).toThrow('no SARIF')
    fs.writeFileSync(path.join(root, 'report.sarif'), '{invalid')
    expect(() => check(root)).toThrow()
    fs.writeFileSync(path.join(root, 'report.sarif'), JSON.stringify(report([{ level: 'error' }])))
    expect(() => check(root)).toThrow('resolve CodeQL')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
