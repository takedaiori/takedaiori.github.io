import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import worker from './worker.mjs'

test('serves immutable images and returns an empty 304 on revalidation', async () => {
  const originalFetch = globalThis.fetch
  const originalCaches = globalThis.caches
  let stored

  globalThis.fetch = async () =>
    new Response('image-bytes', {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': '11',
        'Last-Modified': 'Thu, 06 Aug 2026 11:27:52 GMT'
      }
    })
  globalThis.caches = {
    default: {
      match: async () => stored?.clone(),
      put: async (_key, response) => {
        stored = response.clone()
      }
    }
  }

  try {
    const url = 'https://cdn.example.com/image/example.png?id=page-id'
    const first = await worker.fetch(new Request(url))
    const etag = first.headers.get('etag')

    assert.equal(first.status, 200)
    assert.equal(
      first.headers.get('cache-control'),
      'public, max-age=31536000, s-maxage=31536000, immutable'
    )
    assert.match(etag, /^W\/"[a-f0-9]+-11"$/)

    const byDate = await worker.fetch(
      new Request(url, {
        headers: {
          'If-Modified-Since': 'Thu, 06 Aug 2026 11:27:52 GMT'
        }
      })
    )
    const byEtag = await worker.fetch(
      new Request(url, { headers: { 'If-None-Match': etag } })
    )

    assert.equal(byDate.status, 304)
    assert.equal(byEtag.status, 304)
    assert.equal((await byDate.arrayBuffer()).byteLength, 0)
    assert.equal((await byEtag.arrayBuffer()).byteLength, 0)
  } finally {
    globalThis.fetch = originalFetch
    globalThis.caches = originalCaches
  }
})

test('keeps the VitePress copy-paste example in sync with worker.mjs', async () => {
  const workerSource = await readFile(
    new URL('./worker.mjs', import.meta.url),
    'utf8'
  )
  const tutorial = await readFile(
    new URL(
      '../../docs/security/notion-image-proxy.md',
      import.meta.url
    ),
    'utf8'
  )
  const example = tutorial.match(
    /```js\r?\n(const NOTION_ORIGIN = [\s\S]*?)\r?\n```/
  )

  assert.ok(example, 'VitePress tutorial must include the Worker source')
  assert.equal(normalize(example[1]), normalize(workerSource))
})

function normalize(value) {
  return value.replace(/\r\n/g, '\n').trim()
}

async function withProxy(upstream, action, env) {
  const originalFetch = globalThis.fetch, originalCaches = globalThis.caches
  let writes = 0, calls = 0
  globalThis.fetch = async (_url, options) => {
    calls++
    assert.equal(options.headers.Authorization, undefined)
    assert.equal(options.headers.Cookie, undefined)
    return upstream()
  }
  globalThis.caches = { default: { match: async () => undefined, put: async () => { writes++ } } }
  try { await action(() => worker.fetch(new Request('https://proxy.example/image/test', { headers: { Cookie: 'synthetic=1', Authorization: 'synthetic' } }), env), () => ({ writes, calls })) }
  finally { globalThis.fetch = originalFetch; globalThis.caches = originalCaches }
}

test('rejects HTML and upstream errors without caching', async () => {
  for (const response of [() => new Response('<script>bad</script>', { headers: { 'Content-Type': 'text/html' } }), () => new Response('error', { status: 500 })]) {
    await withProxy(response, async (request, state) => {
      const result = await request()
      assert.ok([415, 502].includes(result.status))
      assert.equal(result.headers.get('cache-control'), 'no-store')
      assert.equal(state().writes, 0)
    })
  }
})

test('bounds both declared and streamed image size', async () => {
  for (const response of [() => new Response('small', { headers: { 'Content-Type': 'image/png', 'Content-Length': '20000000' } }), () => new Response(new Uint8Array(10 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'image/png' } })]) {
    await withProxy(response, async (request, state) => {
      assert.equal((await request()).status, 413)
      assert.equal(state().writes, 0)
    })
  }
})

test('SVG is served with sandbox and nosniff; credentials are not forwarded', async () => {
  await withProxy(() => new Response('<svg/>', { headers: { 'Content-Type': 'image/svg+xml', 'Set-Cookie': 'bad=1', 'Access-Control-Allow-Credentials': 'true' } }), async request => {
    const result = await request()
    assert.match(result.headers.get('content-security-policy'), /sandbox/)
    assert.equal(result.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(result.headers.get('set-cookie'), null)
    assert.equal(result.headers.get('access-control-allow-credentials'), null)
  })
})

test('configured rate limit fails closed and avoids upstream calls', async () => {
  for (const [binding, status] of [[{ limit: async () => ({ success: false }) }, 429], [{ limit: async () => { throw Error('offline') } }, 503]]) {
    await withProxy(() => new Response('unused'), async (request, state) => {
      assert.equal((await request()).status, status)
      assert.equal(state().calls, 0)
    }, { IMAGE_RATE_LIMITER: binding })
  }
})
