import { useRouter } from 'next/router'
import ArticleListPage from './ArticleListPage'

const ArchiveResultPage = props => {
  const router = useRouter()

  const filterValue =
    router?.query?.category ||
    router?.query?.tag ||
    ''

  const label = Array.isArray(filterValue)
    ? filterValue[0]
    : decodeURIComponent(String(filterValue || ''))

  const isCategory =
    router?.pathname?.includes('/category/')

  const base = isCategory
    ? `/category/${encodeURIComponent(label)}/page`
    : `/tag/${encodeURIComponent(label)}/page`

  return (
    <ArticleListPage
      {...props}
      kicker='ARCHIVE RESULT'
      contextLabel={isCategory ? 'CATEGORY' : 'TAG'}
      contextValue={label}
      makePageHref={pageNumber =>
        `${base}/${pageNumber}`
      }
    />
  )
}

export default ArchiveResultPage
