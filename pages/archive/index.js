import { compactListPageData } from '@/lib/utils/listPageData'
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { isBrowser } from '@/lib/utils'
import { formatDateFmt } from '@/lib/utils/formatDate'
import { archiveYears, publishedPosts } from '@/lib/utils/archivePagination'
import { DynamicLayout } from '@/themes/theme'
import { useEffect } from 'react'

/**
 * 归档首页
 * @param {*} props
 * @returns
 */
const ArchiveIndex = props => {
  useEffect(() => {
    if (isBrowser) {
      const anchor = window.location.hash
      if (anchor) {
        setTimeout(() => {
          const anchorElement = document.getElementById(anchor.substring(1))
          if (anchorElement) {
            anchorElement.scrollIntoView({ block: 'start', behavior: 'smooth' })
          }
        }, 300)
      }
    }
  }, [])

  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutArchive' {...props} />
}

export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from: 'archive-index', locale })
  const posts = publishedPosts(props.allPages)
  if (siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG) === 'insignificantia') {
    props.archiveYears = archiveYears(posts)
    props.posts = []
  } else {
    props.posts = posts
    props.archivePosts = posts.reduce((groups, post) => {
      const month = formatDateFmt(post.publishDate, 'yyyy-MM')
      if (!groups[month]) groups[month] = []
      groups[month].push(post)
      return groups
    }, {})
  }
  delete props.allPages

  return {
    props: compactListPageData(props, siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG), siteConfig('CUSTOM_RIGHT_CLICK_CONTEXT_MENU', false, props.NOTION_CONFIG)),
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

export default ArchiveIndex
