'use strict'
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const textTypes = new Set(['.html', '.htm', '.js', '.json', '.css', '.xml', '.txt', '.map', '.svg'])
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----[\r\n]+[A-Za-z0-9+/=\r\n]{64,}/],
  ['github-token', /(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})/],
  ['openai-project-key', /sk-proj-[A-Za-z0-9_-]{40,}/],
  ['supabase-secret-key', /sb_secret_[A-Za-z0-9_-]{24,}/]
]
const bucket = file => file.startsWith('_next/static/') ? 'js-css-fonts' : file.startsWith('_next/data/') ? 'page-json' : file.endsWith('.html') ? 'html' : 'assets'
function audit(root, baseline, secrets = []) {
  const files = {}, groups = {}, findings = [], scriptHosts = new Set()
  const hasSecret = value => patterns.some(([, pattern]) => pattern.test(value)) || secrets.some(secret => secret.length >= 20 && value.includes(secret))
  const safeIdentifier = value => hasSecret(value)
    ? `[redacted-${crypto.createHash('sha256').update(value).digest('hex').slice(0, 12)}]` : value
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      const rawRel = path.relative(root, full).split(path.sep).join('/')
      const rel = safeIdentifier(rawRel)
      if (rel !== rawRel) findings.push({ file: rel, rule: 'credential-in-path' })
      if (entry.isSymbolicLink()) { findings.push({ file: rel, rule: 'symlink' }); continue }
      if (/(^|\/)(?:\.env(?:\.[^/]*)?|\.git|\.build-cache|\.next)(\/|$)/.test(rawRel)) findings.push({ file: rel, rule: 'private-build-file' })
      if (entry.isDirectory()) { walk(full); continue }
      if (!entry.isFile()) continue
      const bytes = fs.statSync(full).size
      files[rel] = bytes
      const group = bucket(rawRel)
      groups[group] = (groups[group] || 0) + bytes
      if (!textTypes.has(path.extname(rawRel).toLowerCase())) continue
      const text = fs.readFileSync(full, 'utf8')
      for (const [rule, pattern] of patterns) if (pattern.test(rule === 'private-key' ? text.replace(/\\r\\n|\\n|\\r/g, '\n') : text)) findings.push({ file: rel, rule })
      if (secrets.some(secret => secret.length >= 20 && text.includes(secret))) findings.push({ file: rel, rule: 'configured-secret' })
      if (/\.html?$/i.test(rawRel)) {
        for (const match of text.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']((?:https?:)?\/\/[^"']+)["']/gi)) {
          try { scriptHosts.add(safeIdentifier(new URL(match[1], 'https://audit.invalid').hostname)) } catch {}
          const scriptUrl = new URL(match[1], 'https://audit.invalid')
          const packageCdn = ['cdn.jsdelivr.net', 'unpkg.com'].includes(scriptUrl.hostname)
          const pinnedPackage = /^\/(?:npm\/)?(?:@[^/]+\/)?[^/@]+@\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?\//i.test(scriptUrl.pathname)
          const mutableCdn = packageCdn && !pinnedPackage
          if (mutableCdn) findings.push({ file: rel, rule: 'unpinned-cdn-script' })
        }
        if (/<(?:script|iframe)\b[^>]*\bsrc\s*=\s*["']\s*(?:javascript|data):/i.test(text)) findings.push({ file: rel, rule: 'executable-resource-url' })
      }
    }
  }
  walk(root)
  const totalBytes = Object.values(files).reduce((sum, value) => sum + value, 0)
  const previous = baseline?.schema === 1 && baseline.files && typeof baseline.totalBytes === 'number' ? baseline : null
  const changed = previous ? [...new Set([...Object.keys(files), ...Object.keys(previous.files)])]
    .map(file => ({ file, bytes: files[file] || 0, delta: (files[file] || 0) - (previous.files[file] || 0) }))
    .filter(file => file.delta).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)) : []
  return { schema: 1, commit: process.env.GITHUB_SHA || 'local', generatedAt: new Date().toISOString(), totalBytes,
    fileCount: Object.keys(files).length, groups, files, findings,
    scriptHosts: [...scriptHosts].sort(), newScriptHosts: previous ? [...scriptHosts].filter(host => !(previous.scriptHosts || []).includes(host)) : [],
    baselineCommit: previous?.commit || null, deltaBytes: previous ? totalBytes - previous.totalBytes : null, changed: changed.slice(0, 30) }
}
function main() {
  const root = path.resolve(process.env.SITE_AUDIT_DIR || 'out')
  const reportDir = process.env.SITE_AUDIT_REPORT_DIR || '.perf'
  if (!fs.existsSync(root)) throw Error('Static output is missing; refusing to report success.')
  let baseline = null
  const baselinePath = process.env.SITE_AUDIT_BASELINE || '.perf/baseline.json'
  if (fs.existsSync(baselinePath)) baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  const secrets = Object.entries(process.env).filter(([key]) => key.startsWith('SCAN_SECRET_')).map(([, value]) => value)
  const report = audit(root, baseline, secrets)
  fs.mkdirSync(reportDir, { recursive: true })
  fs.writeFileSync(path.join(reportDir, 'site-audit-report.json'), JSON.stringify(report, null, 2) + '\n')
  const safe = value => String(value).replace(/[\r\n|`<>]/g, '_')
  const lines = ['\n### Site size and artifact scan\n', `Commit: ${report.commit}`, `Files: ${report.fileCount}; raw output: ${(report.totalBytes / 1048576).toFixed(2)} MiB.`,
    report.baselineCommit ? `Baseline: ${report.baselineCommit}; delta: ${report.deltaBytes >= 0 ? '+' : ''}${(report.deltaBytes / 1048576).toFixed(2)} MiB.` : 'No previous successful report; establishing the first baseline.',
    '\n| Group | MiB |\n| --- | ---: |', ...Object.entries(report.groups).map(([key, value]) => `| ${key} | ${(value / 1048576).toFixed(2)} |`),
    '\n| Changed file | Delta KiB |\n| --- | ---: |', ...report.changed.map(file => `| ${safe(file.file)} | ${(file.delta / 1024).toFixed(1)} |`),
    `\nArtifact scan findings: ${report.findings.length}.`, `External script hosts: ${report.scriptHosts.map(safe).join(', ') || 'none'}.`]
  console.log(`Static output: ${report.fileCount} files, ${report.totalBytes} bytes; scan findings: ${report.findings.length}`)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
  if (report.deltaBytes > Math.max(5 * 1048576, (baseline?.totalBytes || 0) * 0.2)) console.log('::warning::Static output increased by over 20% and 5 MiB; review size report.')
  for (const host of report.newScriptHosts) console.log(`::warning::New external script host: ${safe(host)}`)
  // Never emit matching credential text or snippets, including into the report.
  for (const finding of report.findings) console.error(`Artifact scan blocked: ${finding.rule} in ${safe(finding.file)}`)
  if (report.findings.length) process.exitCode = 1
}
module.exports = { audit, bucket }
if (require.main === module) main()
