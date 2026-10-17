// Only public summaries are used; never include blocks, IDs or credentials.
const names = value => (Array.isArray(value) ? value : [value])
  .map(item => typeof item === 'string' ? item : item?.name || item?.value || item?.text || '')
  .filter(Boolean)

export const postTimestamp = post => {
  if (Number.isFinite(post?.publishDate)) return post.publishDate
  const value = post?.publishDay || post?.date?.start_date || post?.date || ''
  const date = Date.parse(String(value))
  return Number.isFinite(date) ? date : 0
}

export const postYear = post => {
  const text = post?.publishDay || post?.date?.start_date || post?.date || ''
  const match = String(text).match(/^(\d{4})/)
  return match ? match[1] : (postTimestamp(post) ? new Date(postTimestamp(post)).getUTCFullYear().toString() : '')
}

export function buildReadingNavigation(pages, post) {
  const posts = (pages || [])
    .filter(item => item?.type === 'Post' && item.status === 'Published' && item.slug)
    .slice().sort((a, b) => postTimestamp(b) - postTimestamp(a) || a.slug.localeCompare(b.slug))
  const summary = item => item ? { slug: item.slug, title: item.title || '' } : null
  const neighbors = list => {
    const index = list.findIndex(item => item.slug === post?.slug)
    return index < 0 ? { older: null, newer: null } : {
      older: summary(list[index + 1]), newer: summary(list[index - 1])
    }
  }
  const groups = [{ type: 'all', value: '', ...neighbors(posts) }]
  const year = postYear(post)
  if (year) groups.push({ type: 'year', value: year, ...neighbors(posts.filter(item => postYear(item) === year)) })
  for (const type of ['category', 'tag']) {
    const field = type === 'tag' ? 'tags' : 'category'
    for (const value of names(post?.[field])) {
      groups.push({ type, value, ...neighbors(posts.filter(item => names(item[field]).includes(value))) })
    }
  }
  return groups
}

export function readingHref(href, context) {
  if (!context || context.type === 'all' || !href.startsWith('/') || href.startsWith('//')) return href
  const url = new URL(href, 'https://reading.invalid')
  url.searchParams.set('reading', context.type)
  url.searchParams.set('collection', context.value)
  return `${url.pathname}${url.search}${url.hash}`
}

export function selectReadingNavigation(groups, query) {
  const type = typeof query?.reading === 'string' ? query.reading : ''
  const value = typeof query?.collection === 'string' ? query.collection : ''
  return groups?.find(group => group.type === type && group.value === value) ||
    groups?.find(group => group.type === 'all') || { type: 'all', value: '', older: null, newer: null }
}
