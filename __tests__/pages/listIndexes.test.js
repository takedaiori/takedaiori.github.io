import { getStaticProps as categoryProps } from '@/pages/category/index'
import { getStaticProps as tagProps } from '@/pages/tag/index'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'

jest.mock('@/blog.config', () => ({ __esModule: true, default: { THEME: 'insignificantia' } }))
jest.mock('@/lib/config', () => ({ siteConfig: (key, fallback) => fallback }))
jest.mock('@/lib/db/SiteDataApi', () => ({ fetchGlobalAllData: jest.fn() }))
jest.mock('@/themes/theme', () => ({ DynamicLayout: () => null }))

beforeEach(() => fetchGlobalAllData.mockImplementation(async () => ({
  NOTION_CONFIG: {}, categoryOptions: [{ name: 'WPD Archive', count: 46 }], tagOptions: [{ name: 'Games', count: 20 }],
  allPages: Array(1000).fill({ slug: 'article/test' }),
  allNavPages: Array(1000).fill({ id: 'unrelated', slug: 'article/test', title: 'Article' }),
  allLinkPages: Array(1000).fill({ id: 'unrelated', href: '/article/test' })
})))
test.each([['category', categoryProps], ['tag', tagProps]])('%s index preserves options without a site-wide article index', async (_, getProps) => {
  const { props } = await getProps({ locale: 'zh-CN' })
  expect(props.categoryOptions).toEqual([{ name: 'WPD Archive', count: 46 }])
  expect(props.tagOptions).toEqual([{ name: 'Games', count: 20 }])
  expect(props.allPages).toBeUndefined()
  expect(props.allNavPages).toEqual([])
  expect(props.allLinkPages).toEqual([])
  expect(Buffer.byteLength(JSON.stringify(props))).toBeLessThan(128 * 1024)
})
