import { useRouter } from 'next/router'
import ArticleListPage from './ArticleListPage'

const ArchiveResultPage = props => {
  const router = useRouter()

  const isCategory =
    props.category != null ||
    router.pathname.startsWith('/category/')

  // Static props remain available before the router query is hydrated.
  // Next.js already decodes route parameters; do not decode them again.
  const filterValue = isCategory
    ? (props.category ?? router.query.category)
    : (props.tag ?? router.query.tag)

  const label = String(
    (Array.isArray(filterValue) ? filterValue[0] : filterValue) ?? ''
  )
  const base = `/${isCategory ? 'category' : 'tag'}/${encodeURIComponent(label)}`

  return (
    <ArticleListPage
      {...props}
      kicker='ARCHIVE RESULT'
      contextLabel={isCategory ? 'CATEGORY' : 'TAG'}
      contextValue={label}
      makePageHref={pageNumber =>
        pageNumber === 1 ? base : `${base}/page/${pageNumber}`
      }
    />
  )
}

export default ArchiveResultPage
