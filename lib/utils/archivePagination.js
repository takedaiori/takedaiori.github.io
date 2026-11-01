import { postYear, postTimestamp } from './readingNavigation'

export const ARCHIVE_PAGE_SIZE = 15
export const yearPageHref = (year, page = 1) =>
  `/archive/year/${encodeURIComponent(year)}/page/${page}`

export function publishedPosts(pages = []) {
  return pages.filter(post => post.type === 'Post' && post.status === 'Published')
    .slice().sort((a, b) => postTimestamp(b) - postTimestamp(a))
}

export function archiveYears(posts) {
  const counts = new Map()
  posts.forEach(post => {
    const year = postYear(post)
    if (year) counts.set(year, (counts.get(year) || 0) + 1)
  })
  return [...counts].sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, count]) => ({ year, count }))
}

export function yearPage(posts, year, page) {
  const number = Number(page)
  const filtered = posts.filter(post => postYear(post) === year)
  if (!/^\d{4}$/.test(year) || !Number.isInteger(number) || number < 1 ||
      !filtered.length || number > Math.ceil(filtered.length / ARCHIVE_PAGE_SIZE)) return null
  return { posts: filtered.slice((number - 1) * ARCHIVE_PAGE_SIZE, number * ARCHIVE_PAGE_SIZE), postCount: filtered.length, page: number }
}
