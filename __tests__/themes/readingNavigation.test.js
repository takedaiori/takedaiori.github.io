import { buildReadingNavigation, selectReadingNavigation, readingHref } from '@/lib/utils/readingNavigation'

const post = (slug, date, category, tags = []) => ({ slug, title: slug, publishDay: date, category, tags, type: 'Post', status: 'Published' })
const current = post('middle', '2025-06-01', '游戏 / 100%', ['共同'])
const pages = [post('old', '2024-01-01', '游戏 / 100%', ['共同']), post('new', '2026-01-01', '其他'), current, post('same-year', '2025-08-01', '游戏 / 100%', ['共同']), { ...post('draft', '2025-07-01', '游戏 / 100%'), status: 'Invisible' }]

test('uses publication dates regardless of source order and never wraps boundaries', () => {
 const groups = buildReadingNavigation(pages, current)
 expect(groups[0].older.slug).toBe('old')
 expect(groups[0].newer.slug).toBe('same-year')
 expect(buildReadingNavigation(pages, pages[1])[0].newer).toBeNull()
 expect(buildReadingNavigation(pages, pages[0])[0].older).toBeNull()
})
test('year, category and tag select only their collection across all list pages', () => {
 const groups = buildReadingNavigation(pages, current)
 const year = selectReadingNavigation(groups, { reading: 'year', collection: '2025' })
 expect(year.older).toBeNull()
 expect(year.newer.slug).toBe('same-year')
 for (const type of ['category', 'tag']) {
  const value = type === 'category' ? '游戏 / 100%' : '共同'
  const context = selectReadingNavigation(groups, { reading: type, collection: value })
  expect(context.older.slug).toBe('old')
  expect(context.newer.slug).toBe('same-year')
  const href = readingHref('/article/old', context)
  const url = new URL(href, 'https://test.local')
  expect(url.searchParams.get('collection')).toBe(value)
  expect(selectReadingNavigation(buildReadingNavigation(pages, pages[0]), Object.fromEntries(url.searchParams)).type).toBe(type)
 }
 expect(selectReadingNavigation(groups, { reading: 'category', collection: 'not-a-member' }).type).toBe('all')
 expect(readingHref('/article/middle', null)).toBe('/article/middle')
 expect(JSON.stringify(groups)).not.toContain('Invisible')
})
