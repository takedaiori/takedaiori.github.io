<!-- Executable Worker example consumed by cloudflare/notion-image-proxy/worker.test.mjs. Keep this code identical to worker.mjs. -->

```js
const NOTION_ORIGIN = 'https://www.notion.so'
const IMMUTABLE_TTL_SECONDS = 60 * 60 * 24 * 365
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url)

    if (!isAllowedPath(url.pathname)) {
      return new Response('Not found', { status: 404 })
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 })
    }

    if (url.href.length > 8192) return new Response('Request too large', { status: 414 })
    const width = url.searchParams.get('width')
    if (width && (!/^\d{1,4}$/.test(width) || Number(width) > 4096)) {
      return new Response('Invalid image width', { status: 400 })
    }
    // Optional Cloudflare rate-limit binding; account-level limits remain necessary.
    if (env.IMAGE_RATE_LIMITER) {
      try {
        const result = await env.IMAGE_RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' })
        if (!result.success) return new Response('Rate limit exceeded', { status: 429 })
      } catch {
        return new Response('Rate limiter unavailable', { status: 503 })
      }
    }

    const cache = caches.default
    const versionedCacheUrl = new URL(request.url)
    versionedCacheUrl.searchParams.set('__proxy_security', '2')
    const cacheKey = new Request(versionedCacheUrl, { method: 'GET' })
    const cached = await cache.match(cacheKey)
    if (cached) {
      const hitHeaders = new Headers(cached.headers)
      setCacheHeaders(hitHeaders)
      setValidatorHeaders(hitHeaders)
      hitHeaders.set('X-Notion-Image-Proxy-Cache', 'HIT')
      if (isNotModified(request, hitHeaders)) {
        return notModifiedResponse(hitHeaders)
      }
      return new Response(request.method === 'HEAD' ? null : cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: hitHeaders
      })
    }

    const upstreamUrl = new URL(url.pathname + url.search, NOTION_ORIGIN)
    let response
    try {
      response = await fetch(upstreamUrl, {
      signal: AbortSignal.timeout(10000),
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
      })
      if (!response.ok) {
        await response.body?.cancel()
        return new Response('Upstream image unavailable', { status: response.status >= 500 ? 502 : 404, headers: { 'Cache-Control': 'no-store' } })
      }
      const type = (response.headers.get('content-type') || '').split(';')[0].toLowerCase()
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
      if (!allowed.includes(type)) {
        await response.body?.cancel()
        return new Response('Unsupported image response', { status: 415, headers: { 'Cache-Control': 'no-store' } })
      }
      const maxBytes = 10 * 1024 * 1024
      if (Number(response.headers.get('content-length') || 0) > maxBytes) {
        await response.body?.cancel()
        return new Response('Image too large', { status: 413, headers: { 'Cache-Control': 'no-store' } })
      }
      const reader = response.body?.getReader()
      const chunks = []
      let size = 0
      if (reader) {
        while (true) {
          const chunk = await reader.read()
          if (chunk.done) break
          size += chunk.value.byteLength
          if (size > maxBytes) {
            await reader.cancel()
            return new Response('Image too large', { status: 413, headers: { 'Cache-Control': 'no-store' } })
          }
          chunks.push(chunk.value)
        }
      }
      const body = new Uint8Array(size)
      let offset = 0
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
      const safeHeaders = new Headers()
      for (const name of ['content-type', 'etag', 'last-modified']) {
        const value = response.headers.get(name)
        if (value) safeHeaders.set(name, value)
      }
      safeHeaders.set('Content-Length', String(size))
      safeHeaders.set('X-Content-Type-Options', 'nosniff')
      safeHeaders.set('Content-Security-Policy', "default-src 'none'; sandbox")
      safeHeaders.set('Referrer-Policy', 'no-referrer')
      response = new Response(body, { status: 200, headers: safeHeaders })
    } catch {
      return new Response('Image fetch failed', { status: 502, headers: { 'Cache-Control': 'no-store' } })
    }

    const headers = new Headers(response.headers)
    setCacheHeaders(headers)
    setValidatorHeaders(headers)
    headers.set('X-Notion-Image-Proxy', '1')
    headers.set('X-Notion-Image-Proxy-Cache', 'MISS')
    headers.delete('set-cookie')
    headers.delete('content-security-policy-report-only')
    headers.delete('vary')

    const proxied = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
    if (response.ok) {
      await cache.put(cacheKey, proxied.clone())
    }

    if (isNotModified(request, headers)) {
      return notModifiedResponse(headers)
    }

    return request.method === 'HEAD' ? new Response(null, proxied) : proxied
  }
}

function isAllowedPath(pathname) {
  return pathname.startsWith('/image/') || pathname.startsWith('/images/')
}

function setCacheHeaders(headers) {
  headers.set(
    'Cache-Control',
    `public, max-age=${IMMUTABLE_TTL_SECONDS}, s-maxage=${IMMUTABLE_TTL_SECONDS}, immutable`
  )
}

function setValidatorHeaders(headers) {
  if (headers.has('etag')) return

  const lastModified = Date.parse(headers.get('last-modified') || '')
  const contentLength = headers.get('content-length') || 'unknown'
  if (!Number.isNaN(lastModified)) {
    headers.set('ETag', `W/"${lastModified.toString(16)}-${contentLength}"`)
  }
}

function isNotModified(request, headers) {
  const etag = headers.get('etag')
  const ifNoneMatch = request.headers.get('if-none-match')
  if (etag && ifNoneMatch) {
    return ifNoneMatch
      .split(',')
      .map(value => value.trim())
      .some(value => value === '*' || weakEtag(value) === weakEtag(etag))
  }

  const lastModified = Date.parse(headers.get('last-modified') || '')
  const ifModifiedSince = Date.parse(
    request.headers.get('if-modified-since') || ''
  )
  return (
    !Number.isNaN(lastModified) &&
    !Number.isNaN(ifModifiedSince) &&
    lastModified <= ifModifiedSince
  )
}

function weakEtag(value) {
  return value.replace(/^W\//, '')
}

function notModifiedResponse(headers) {
  const notModifiedHeaders = new Headers(headers)
  notModifiedHeaders.delete('content-length')
  notModifiedHeaders.delete('content-encoding')
  notModifiedHeaders.delete('content-range')
  return new Response(null, { status: 304, headers: notModifiedHeaders })
}
```
