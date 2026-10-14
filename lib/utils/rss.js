import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { Feed } from 'feed'
import fs from 'fs'
import { decryptEmail } from '@/lib/plugins/mailEncrypt'

export function shouldGenerateRssForLocale({
  locale,
  defaultLocale = BLOG.LANG
} = {}) {
  return !locale || locale === defaultLocale
}

/** Select only the three most recently published articles for every feed format. */
export function getRssPosts(posts = []) {
  return [...posts]
    .filter(post => post.type === 'Post' && post.status === 'Published')
    .sort((a, b) => {
      const dateA = new Date(a.publishDay || a.publishDate || 0)
      const dateB = new Date(b.publishDay || b.publishDate || 0)
      return dateB - dateA
    })
    .slice(0, 3)
}

/**
 * 生成RSS数据
 * @param {*} props
 */
export async function generateRss(props) {
  const { NOTION_CONFIG, siteInfo, allPages, latestPosts } = props
  const TITLE = siteInfo?.title
  const DESCRIPTION = siteInfo?.description
  const LINK = siteConfig('LINK', siteInfo?.link, NOTION_CONFIG)
  const AUTHOR = NOTION_CONFIG?.AUTHOR || BLOG.AUTHOR
  const LANG = siteConfig('LANG', BLOG.LANG, NOTION_CONFIG)
  const SUB_PATH = NOTION_CONFIG?.SUB_PATH || BLOG.SUB_PATH || ''
  const CONTACT_EMAIL = decryptEmail(
    NOTION_CONFIG?.CONTACT_EMAIL || BLOG.CONTACT_EMAIL
  )

  // 检查 feed 文件是否在10分钟内更新过
  if (isFeedRecentlyUpdated('./public/rss/feed.xml', 10)) {
    return
  }

  console.log('[RSS订阅] 生成/rss/feed.xml')
  const year = new Date().getFullYear()
  const feed = new Feed({
    title: TITLE,
    description: DESCRIPTION,
    link: `${LINK}/${SUB_PATH}`,
    language: LANG,
    favicon: `${LINK}/favicon.png`,
    copyright: `All rights reserved ${year}, ${AUTHOR}`,
    author: {
      name: AUTHOR,
      email: CONTACT_EMAIL,
      link: LINK
    }
  })
  for (const post of getRssPosts(allPages || latestPosts)) {
    feed.addItem({
      title: post.title,
      link: `${LINK}/${post.slug}`,
      description: post.summary || '',
      date: new Date(post?.publishDay || post?.publishDate || Date.now())
    })
  }

  try {
    fs.mkdirSync('./public/rss', { recursive: true })
    await Promise.all([
      fs.promises.writeFile('./public/rss/feed.xml', feed.rss2()),
      fs.promises.writeFile('./public/rss/atom.xml', feed.atom1()),
      fs.promises.writeFile('./public/rss/feed.json', feed.json1())
    ])
  } catch (error) {
    // 在vercel运行环境是只读的，这里会报错；
    // 但在vercel编译阶段、或VPS等其他平台这行代码会成功执行
    // RSS被高频词访问将大量消耗服务端资源，故作为静态文件
  }
}

/**
 * 检查上次更新，如果60分钟内更新过就不操作。
 * @param {*} filePath
 * @param {*} intervalMinutes
 * @returns
 */
function isFeedRecentlyUpdated(filePath, intervalMinutes = 60) {
  try {
    const stats = fs.statSync(filePath)
    const now = new Date()
    const lastModified = new Date(stats.mtime)
    const timeDifference = (now - lastModified) / (1000 * 60) // 转换为分钟
    return timeDifference < intervalMinutes
  } catch (error) {
    // 如果文件不存在，我们需要创建它
    return false
  }
}
