import { compactArticlePageData } from '@/lib/utils/articlePageData'
import { selectReadingNavigation } from '@/lib/utils/readingNavigation'

test('keeps body, TOC and collection neighbors while selecting article and notice links', () => {
  const referenced = { id: 'aabbccdd-eeff-0011-2233-445566778899', short_id: '2233445566778899', href: '/article/target', slug: 'article/target', title: 'Target' }
  const noticeLink = { id: '11223344-5566-7788-99aa-bbccddeeff00', href: '/about' }
  const post = { title: 'Article', blockMap: { block: { text: [['link', [['a', '/aabbccddeeff00112233445566778899']]]] } }, toc: [{ id: 'heading' }] }
  const props = { post, notice: { blockMap: { block: { n: { value: { properties: { title: [['notice', [['p', noticeLink.id]]]] } } } } } }, allNavPages: [referenced], allLinkPages: [referenced, noticeLink, { id: 'unrelated', href: '/other' }], recommendPosts: [referenced],
    readingNavigation: [{ type: 'all', value: '', older: { slug: 'article/old' } }, { type: 'category', value: 'Games', newer: { slug: 'article/new' } }] }
  const result = compactArticlePageData(props, 'insignificantia')
  expect(result.post).toBe(post)
  expect(result.post.blockMap).toBe(post.blockMap)
  expect(result.post.toc).toBe(post.toc)
  expect(result.allLinkPages.map(page => page.href)).toEqual(['/article/target', '/about'])
  expect(result.allNavPages).toEqual([])
  expect(result.recommendPosts).toBeUndefined()
  expect(selectReadingNavigation(result.readingNavigation, { reading: 'category', collection: 'Games' }).newer.slug).toBe('article/new')
  expect(props.allLinkPages).toHaveLength(3)
  expect(props.recommendPosts).toHaveLength(1)
  expect(compactArticlePageData(props, 'other')).toBe(props)
  expect(compactArticlePageData(props, 'insignificantia', true).allNavPages[0].slug).toBe('article/target')
})
