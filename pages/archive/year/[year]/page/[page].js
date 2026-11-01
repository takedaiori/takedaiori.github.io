import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { archiveYears, publishedPosts, yearPage, ARCHIVE_PAGE_SIZE } from '@/lib/utils/archivePagination'
import { compactListPageData } from '@/lib/utils/listPageData'
import { DynamicLayout } from '@/themes/theme'

export default function ArchiveYear(props) {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutArchive' {...props} />
}

export async function getStaticPaths() {
  const { allPages } = await fetchGlobalAllData({ from: 'archive-year-paths' })
  const paths = archiveYears(publishedPosts(allPages)).flatMap(({ year, count }) =>
    Array.from({ length: Math.ceil(count / ARCHIVE_PAGE_SIZE) }, (_, i) =>
      ({ params: { year, page: String(i + 1) } }))
  )
  return { paths, fallback: false }
}

export async function getStaticProps({ params: { year, page }, locale }) {
  const data = await fetchGlobalAllData({ from: 'archive-year-page', locale })
  const selected = yearPage(publishedPosts(data.allPages), year, page)
  if (!selected) return { notFound: true }
  const props = { ...data, ...selected, archiveYear: year }
  delete props.allPages
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return {
    props: compactListPageData(props, theme, siteConfig('CUSTOM_RIGHT_CLICK_CONTEXT_MENU', false, props.NOTION_CONFIG)),
    revalidate: process.env.EXPORT ? undefined : siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND, props.NOTION_CONFIG)
  }
}
