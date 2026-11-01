import { getStaticPaths, getStaticProps } from '@/pages/archive/year/[year]/page/[page]'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'

jest.mock('@/blog.config', () => ({ __esModule: true, default: { THEME: 'insignificantia' } }))
jest.mock('@/lib/config', () => ({ siteConfig: (key, fallback) => fallback }))
jest.mock('@/lib/db/SiteDataApi', () => ({ fetchGlobalAllData: jest.fn() }))
jest.mock('@/themes/theme', () => ({ DynamicLayout: () => null }))

const posts = Array.from({ length: 32 }, (_, i) => ({ id: `id-${i}`, slug: `article/${i}`, href: `/article/${i}`, type: 'Post', status: 'Published', title: `Post ${i}`, summary: 'Summary', publishDay: '2026-01-01', publishDate: i }))
beforeEach(() => fetchGlobalAllData.mockImplementation(async () => ({ allPages: posts, allNavPages: posts, allLinkPages: posts, NOTION_CONFIG: {} })))
test('exports every year page and sends only the requested slice', async () => {
  const paths = await getStaticPaths()
  expect(paths.fallback).toBe(false)
  expect(paths.paths).toEqual([1, 2, 3].map(page => ({ params: { year: '2026', page: String(page) } })))
  const { props } = await getStaticProps({ params: { year: '2026', page: '3' } })
  expect(props.posts).toHaveLength(2)
  expect(props).toMatchObject({ archiveYear: '2026', postCount: 32, page: 3 })
  expect(props.allPages).toBeUndefined()
  expect(props.allNavPages).toEqual([])
  expect(props.allLinkPages).toEqual([])
  expect(await getStaticProps({ params: { year: '2026', page: '4' } })).toEqual({ notFound: true })
})
