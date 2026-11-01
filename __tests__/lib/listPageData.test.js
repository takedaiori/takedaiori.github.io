import { compactListPageData } from '@/lib/utils/listPageData'
import { postYear } from '@/lib/utils/readingNavigation'

test('keeps list presentation, year filtering and links without duplicating archive or assets', () => {
  const post = { id: 'one', slug: 'article/one', href: '/article/one', type: 'Post', title: 'One', summary: 'Summary', category: ['WPD Archive'], publishDate: 1704067200000, publishDay: '2024-01-01', pageCoverThumbnail: 'large-cover', blockMap: { block: 'large-content' } }
  const props = { posts: [post], archivePosts: { '2024-01': [post] }, allNavPages: [post], allLinkPages: [{ id: 'notice', slug: 'notice' }], postCount: 45, page: 2, category: 'WPD Archive' }
  const result = compactListPageData(props, 'insignificantia')
  expect(result.posts[0]).toMatchObject({ title: 'One', summary: 'Summary', href: '/article/one', category: ['WPD Archive'] })
  expect(postYear(result.posts[0])).toBe('2024')
  expect(result).toMatchObject({ page: 2, postCount: 45, category: 'WPD Archive' })
  expect(result.archivePosts).toBeUndefined()
  expect(result.posts[0].blockMap).toBeUndefined()
  expect(result.allNavPages[0]).toEqual({ id: 'one', title: 'One', slug: 'article/one', href: '/article/one' })
  expect(result.allLinkPages).toBe(props.allLinkPages)
  expect(props.archivePosts).toBeDefined()
  expect(post.blockMap).toBeDefined()
  expect(compactListPageData(props, 'other')).toBe(props)
})
