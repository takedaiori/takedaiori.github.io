import fs from 'fs'
import { generateRss, getRssPosts, shouldGenerateRssForLocale } from '@/lib/utils/rss'
import { getPostBlocks } from '@/lib/db/SiteDataApi'

const addItemMock = jest.fn()
jest.mock('feed', () => ({
  Feed: jest.fn().mockImplementation(() => ({
    addItem: addItemMock,
    rss2: jest.fn(() => '<rss>ok</rss>'),
    atom1: jest.fn(() => '<atom>ok</atom>'),
    json1: jest.fn(() => '{"ok":true}')
  }))
}))
jest.mock('@/lib/db/SiteDataApi', () => ({ getPostBlocks: jest.fn() }))

describe('generateRss', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(fs, 'statSync').mockImplementation(() => { throw new Error('ENOENT') })
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {})
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined)
  })
  afterEach(() => { jest.restoreAllMocks() })

  it('selects the latest three published posts without changing source order', () => {
    const posts = [1, 5, 3, 4, 2].map(id => ({
      id,
      type: 'Post',
      status: 'Published',
      publishDay: `2026-10-0${id}`,
      lastEditedDate: id === 1 ? '2026-10-31' : '2026-10-01'
    }))
    posts.push(
      { id: 6, type: 'Post', status: 'Draft', publishDay: '2026-10-30' },
      { id: 7, type: 'Page', status: 'Published', publishDay: '2026-10-31' }
    )
    const original = [...posts]
    expect(getRssPosts(posts).map(post => post.id)).toEqual([5, 4, 3])
    expect(posts).toEqual(original)
    expect(getRssPosts([])).toEqual([])
    expect(getRssPosts([posts[0]])).toEqual([posts[0]])
  })

  it('uses summaries and original links even when full content is configured', async () => {
    const posts = [1, 5, 3, 4, 2].map(id => ({
      id: `post-${id}`,
      type: 'Post',
      status: 'Published',
      title: `Article ${id}`,
      slug: `article/${id}`,
      summary: `Summary ${id}`,
      publishDay: `2026-10-0${id}`
    }))
    await generateRss({
      NOTION_CONFIG: { AUTHOR: 'author', LANG: 'zh-CN', SUB_PATH: '', CONTACT_EMAIL: '', RSS_FULL_CONTENT: true },
      siteInfo: { title: 'site', description: 'desc', link: 'https://example.com' },
      allPages: posts,
      latestPosts: [posts[0]]
    })
    expect(addItemMock).toHaveBeenCalledTimes(3)
    expect(addItemMock.mock.calls.map(([item]) => item.title)).toEqual(['Article 5', 'Article 4', 'Article 3'])
    for (const [item] of addItemMock.mock.calls) {
      expect(item.description).toMatch(/^Summary /)
      expect(item.link).toMatch(/^https:\/\/example.com\/article\//)
      expect(item).not.toHaveProperty('content')
    }
    expect(getPostBlocks).not.toHaveBeenCalled()
    expect(fs.promises.writeFile).toHaveBeenCalledTimes(3)
  })

  it('generates RSS only for the default locale during multi-locale builds', () => {
    expect(shouldGenerateRssForLocale({ locale: undefined })).toBe(true)
    expect(shouldGenerateRssForLocale({ locale: 'zh-CN', defaultLocale: 'zh-CN' })).toBe(true)
    expect(shouldGenerateRssForLocale({ locale: 'en', defaultLocale: 'zh-CN' })).toBe(false)
  })
})
