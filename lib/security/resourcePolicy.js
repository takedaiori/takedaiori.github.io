/** Configurable resources may use this origin or HTTPS, never executable URLs. */
export function isSafeResourceUrl(value, origin) {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value, origin)
    return !url.username && !url.password &&
      (url.protocol === 'https:' || (url.origin === origin && url.protocol === 'http:'))
  } catch {
    return false
  }
}

/** Remote executable dependencies require a reviewed provider and exact version. */
export function isSafeScriptUrl(value, origin) {
  if (!isSafeResourceUrl(value, origin)) return false
  const url = new URL(value, origin)
  if (url.origin === origin) return true
  if (url.origin === 'https://static.cloudflareinsights.com' && url.pathname === '/beacon.min.js') return true
  if (url.origin === 'https://cdnjs.cloudflare.com') {
    return /^\/ajax\/libs\/[a-z0-9._-]+\/\d+\.\d+\.\d+(?:[.-][a-z0-9.-]+)?\//i.test(url.pathname)
  }
  if (url.origin === 'https://cdn.jsdelivr.net') {
    return /^\/npm\/(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+@\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?\//i.test(url.pathname)
  }
  return false
}

/** Custom styling is limited to repository-controlled, same-origin files. */
export function isSameOriginResource(value) {
  if (typeof window === 'undefined' || !isSafeResourceUrl(value, window.location.origin)) return false
  return new URL(value, window.location.origin).origin === window.location.origin
}
