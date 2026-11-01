import { archiveYears, publishedPosts, yearPage, yearPageHref } from '@/lib/utils/archivePagination'

const posts = Array.from({ length: 32 }, (_, i) => ({
  slug: `article/${i}`, type: 'Post', status: 'Published', publishDay: '2026-01-01', publishDate: i
}))
test('year routes have disjoint 15-post slices and reject missing pages', () => {
  const sorted = publishedPosts([...posts, { type: 'Post', status: 'Draft' }])
  expect(archiveYears(sorted)).toEqual([{ year: '2026', count: 32 }])
  const pages = [1, 2, 3].map(page => yearPage(sorted, '2026', String(page)))
  expect(pages.map(page => page.posts.length)).toEqual([15, 15, 2])
  expect(new Set(pages.flatMap(page => page.posts.map(post => post.slug))).size).toBe(32)
  expect(pages.every(page => page.postCount === 32)).toBe(true)
  for (const page of ['0', '-1', '1.5', '4', 'bad']) expect(yearPage(sorted, '2026', page)).toBeNull()
  expect(yearPage(sorted, '2025', '1')).toBeNull()
  expect(yearPageHref('2026', 2)).toBe('/archive/year/2026/page/2')
})
