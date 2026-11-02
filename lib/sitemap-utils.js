const isAbsoluteHttpUrl = value =>
  typeof value === 'string' && /^(https?:)?\/\//i.test(value.trim())

export const normalizeSitemapBaseUrl = link => {
  if (typeof link !== 'string') return ''
  return link.trim().replace(/\/+$/, '')
}

export const normalizeSitemapLocale = locale => {
  if (!locale) return ''
  const value = String(locale).trim()
  if (!value) return ''
  return value.startsWith('/') ? value : `/${value}`
}

export const toSitemapDateString = (
  dateInput,
  fallbackDate = new Date().toISOString().split('T')[0]
) => {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return fallbackDate
  }
  return date.toISOString().split('T')[0]
}

export const buildSitemapLoc = ({
  baseUrl,
  locale = '',
  slug
} = {}) => {
  const normalizedBaseUrl = normalizeSitemapBaseUrl(baseUrl)
  if (!normalizedBaseUrl) return null

  const normalizedLocale = normalizeSitemapLocale(locale)

  if (slug === undefined || slug === null || slug === '') {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  const rawSlug = String(slug).trim()
  if (!rawSlug || rawSlug === '#') {
    return null
  }

  if (isAbsoluteHttpUrl(rawSlug)) {
    try {
      const targetUrl = new URL(rawSlug, normalizedBaseUrl)
      const siteUrl = new URL(normalizedBaseUrl)

      // sitemap 仅收录本站链接，避免外链混入
      if (targetUrl.hostname !== siteUrl.hostname) {
        return null
      }

      return targetUrl.toString().replace(/\/+$/, '')
    } catch (error) {
      return null
    }
  }

  const normalizedSlug = rawSlug.replace(/^\/+/, '')
  if (!normalizedSlug) {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  return `${normalizedBaseUrl}${normalizedLocale}/${normalizedSlug}`
}

export const normalizeSiteUrl = normalizeSitemapBaseUrl

export const createSiteUrl = (baseUrl, slug) =>
  buildSitemapLoc({ baseUrl, slug })

/** Keep each pagination/detail route canonical; query/hash never identify a new page. */
export const createCanonicalUrl = (baseUrl, asPath) => {
  if (typeof asPath !== 'string' || !asPath.startsWith('/') || asPath.startsWith('//') || /[\\\u0000-\u001f]/.test(asPath)) return null
  const base = normalizeSiteUrl(baseUrl)
  if (!base) return null
  try {
    const parsedBase = new URL(base)
    if (!['http:', 'https:'].includes(parsedBase.protocol) || parsedBase.username || parsedBase.password) return null
    const pathname = asPath.split(/[?#]/, 1)[0]
    const canonical = new URL(base + '/' + pathname.replace(/^\/+/, ''))
    return canonical.origin === parsedBase.origin ? canonical.href : null
  } catch { return null }
}
