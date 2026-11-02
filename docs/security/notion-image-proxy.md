# Notion 图片代理安全版本

本文件是仓库中的源码与沙盒测试，不代表 Cloudflare 线上 Worker 已更新。Pages 部署不会发布 Worker。

如果当前仍使用此代理：在 Cloudflare Dashboard → Workers & Pages → 对应 Worker → Edit code，复制下面完整代码后先保存预览，检查首页和文章图片，再 Deploy。无法在此连接读取实际部署版本、域名绑定、WAF、预算或账户权限，因此这些项目仍待后台核验。不要发送 API Token。

限流绑定须通过 Wrangler 配置，不能按 Dashboard 中的普通绑定来配置或核验；Cloudflare 官方说明该绑定目前不会显示在面板中。需要 Wrangler 4.36.0 或更高版本。

仅在你实际使用这个 Worker 时，在它现有的 wrangler.toml 中加入以下配置。1001 是示例：先确认账户内未被其他 Worker 使用，再选择独立的正整数命名空间，避免共享计数。代码文件名、Worker 名称和域名沿用你当前项目，不要直接用示例域名覆盖生产配置。

```toml
[[ratelimits]]
name = "IMAGE_RATE_LIMITER"
namespace_id = "1001"

[ratelimits.simple]
limit = 120
period = 60
```

120 次/60 秒仅作为初始观察值，须按实际每页图片数和访问量调整。有绑定时超限返回 429、绑定故障返回 503。它是每个 Cloudflare 节点的近似限流，不是跨节点的严格全局额度或费用硬上限；没有绑定时不声称已限流。还需在账户中核对请求量、费用告警和 WAF。若确需严格全局限额，要另行设计并验证 Durable Objects 方案，本轮不创建新的计费服务。

使用现有 Wrangler 登录状态，先执行 wrangler deploy --dry-run，核对输出中的 Worker 名称、路由和绑定，再执行 wrangler deploy。不要把 API Token 粘贴进配置或聊天。部署后通过 Workers Logs/Traces 观察 429 与 503；不能因 Dashboard 看不到该绑定就断言没有配置。

官方依据：[Cloudflare Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)。

源码仅向固定 Notion 起始域请求，不转发 Cookie 或 Authorization；只允许图片响应，禁止缓存错误，限制 10 MiB 与 10 秒请求时间，为 SVG 和其他图片设置 sandbox CSP 和 nosniff；新缓存版本不会复用旧版本未校验的条目。保留图片内容、ETag、Last-Modified、GET/HEAD 和条件请求。拒绝宽度超过 4096 的变换请求。超大图片需要在源头优化，不能靠无限制代理放开。

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
