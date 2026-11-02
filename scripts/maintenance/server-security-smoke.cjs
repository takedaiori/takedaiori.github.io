'use strict'
const { spawn } = require('node:child_process')
const assert = require('node:assert/strict')
const fs = require('node:fs')
async function main() {
  const port = 41000 + Math.floor(Math.random() * 10000)
  const origin = `http://127.0.0.1:${port}`
  const env = { ...process.env }
  for (const name of ['CACHE_REVALIDATION_TOKEN', 'SERVER_SUBSCRIPTIONS_ENABLED', 'SERVER_NOTION_COMMENTS_ENABLED', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']) delete env[name]
  const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], { env, stdio: 'ignore' })
  const report = []
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw Error('Validation server exited before becoming ready')
      try {
        const response = await fetch(origin + '/api/cache', { signal: AbortSignal.timeout(1000) })
        if (response.status === 405) { ready = true; break }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    assert(ready, 'Validation server did not become ready')
    for (const [route, method, status] of [
      ['/api/cache', 'GET', 405], ['/api/cache', 'POST', 503],
      ['/api/auth/callback/notion?code=validation-only', 'GET', 503],
      ['/api/subscribe', 'POST', 503], ['/api/notion-comments', 'POST', 503],
      ['/api/user', 'GET', 503]
    ]) {
      const response = await fetch(origin + route, { method, redirect: 'manual', signal: AbortSignal.timeout(10000),
        ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: '{}' } : {}) })
      assert.equal(response.status, status, route)
      assert.equal(response.headers.get('location'), null, route + ' must not redirect secrets')
      report.push({ route, method, status })
    }
    for (const route of ['/dplayer.htm', '/games-external/common/index.htm']) {
      const response = await fetch(origin + route + '?n=javascript:parent.auditProbe=1')
      assert.equal(response.status, 200)
      const body = await response.text()
      assert(!/<(?:script|iframe)\b/i.test(body), route)
      assert(body.includes("default-src 'none'"), route)
      report.push({ route, status: response.status, inert: true })
    }
    fs.mkdirSync('.perf', { recursive: true })
    fs.writeFileSync('.perf/server-security-smoke.json', JSON.stringify(report, null, 2) + '\n')
    console.log(`Server security smoke checks passed: ${report.length}`)
  } finally {
    server.kill('SIGTERM')
    await new Promise(resolve => {
      if (server.exitCode !== null) return resolve()
      server.once('exit', resolve)
      const timer = setTimeout(() => { server.kill('SIGKILL'); resolve() }, 3000)
      timer.unref()
    })
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
