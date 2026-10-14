import Link from 'next/link'
import { useRouter } from 'next/router'

const PAGE_SIZE = 15

const safeNumber = (value, fallback) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0
    ? number
    : fallback
}

const getHref = post => {
  if (post?.href) return post.href
  if (post?.slug) return `/${post.slug}`
  return '/'
}

const getDate = post =>
  post?.publishDay || post?.date || ''

const normalizeCategory = value => {
  if (!value) return ''

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return normalizeCategory(value[0])
  }

  if (typeof value === 'object') {
    return (
      value.name ||
      value.value ||
      value.label ||
      value.text ||
      ''
    )
  }

  return String(value)
}

const getCategory = post =>
  normalizeCategory(
    post?.category ||
    post?.categoryItems ||
    post?.categories
  )

const isArticle = post => {
  if (!post) return false

  const type = String(post.type || '').toLowerCase()
  const excluded = new Set([
    'menu',
    'submenu',
    'page',
    'notice',
    'config'
  ])

  return !excluded.has(type)
}

const ArticleListPage = ({
  posts,
  archivePosts,
  postCount,
  totalPostCount,
  total,
  page,
  pageNum,
  currentPage: currentPageProp,
  kicker = 'ARTICLE',
  contextLabel = '',
  contextValue = '',
  pageSize = PAGE_SIZE,
  makePageHref
}) => {
  const router = useRouter()

  const currentPage = safeNumber(
    router?.query?.page ||
      router?.query?.p ||
      page ||
      pageNum ||
      currentPageProp,
    1
  )

  const rawPosts =
    Array.isArray(posts) && posts.length > 0
      ? posts
      : Array.isArray(archivePosts)
        ? archivePosts
        : []

  const sourcePosts = rawPosts.filter(isArticle)

  const declaredPostCount = safeNumber(
    postCount ||
      totalPostCount ||
      total ||
      sourcePosts.length,
    sourcePosts.length
  )

  const totalPages = Math.max(
    1,
    Math.ceil(declaredPostCount / pageSize)
  )

  const postsAreAlreadyPaged =
    declaredPostCount > sourcePosts.length &&
    sourcePosts.length <= pageSize

  const visiblePosts = postsAreAlreadyPaged
    ? sourcePosts
    : sourcePosts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      )

  const pageHref = pageNumber => {
    if (typeof makePageHref === 'function') {
      return makePageHref(pageNumber)
    }

    return pageNumber === 1
      ? '/page/1'
      : `/page/${pageNumber}`
  }

  return (
    <main
      className='ins-article-index'
      data-mobile-frame='article-list-v1.10'
      style={{
        width: '100%',
        boxSizing: 'border-box'
      }}>
      <div
        data-safe-frame='article-list-v1.11'
        style={{
          width: 'calc(100% - 40px)',
          maxWidth: '900px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box'
        }}>
      <header className='ins-article-index-header'>
        <div className='ins-page-kicker'>
          {kicker}
        </div>

        {contextValue && (
          <div className='ins-result-context'>
            {contextLabel && (
              <span className='ins-result-context-label'>
                {contextLabel}
              </span>
            )}
            <strong className='ins-result-context-value'>
              {contextValue}
            </strong>
          </div>
        )}
      </header>

      <section
        className='ins-article-index-list'
        aria-label={kicker}>
        {visiblePosts.map((post, index) => (
          <Link
            key={
              post.id ||
              post.pageId ||
              post.slug ||
              `${post.title}-${index}`
            }
            href={getHref(post)}
            className='ins-article-list-card'
            aria-label={`阅读：${
              post?.title || 'Untitled'
            }`}>
            <div className='ins-article-list-date'>
              {getDate(post)}
            </div>

            <h2>{post?.title || 'Untitled'}</h2>

            {post?.summary && (
              <p>{post.summary}</p>
            )}

            <div className='ins-article-list-actions'>
              {getCategory(post) && (
                <span className='ins-card-category'>
                  {getCategory(post)}
                </span>
              )}

              <span className='ins-read-more'>
                继续阅读
              </span>
            </div>
          </Link>
        ))}

        {visiblePosts.length === 0 && (
          <div className='ins-article-list-empty'>
            暂时没有可显示的文章。
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <nav
          className='ins-pagination'
          aria-label='文章分页'>
          {Array.from(
            { length: totalPages },
            (_, index) => {
              const pageNumber = index + 1

              return (
                <Link
                  key={pageNumber}
                  href={pageHref(pageNumber)}
                  aria-current={
                    pageNumber === currentPage
                      ? 'page'
                      : undefined
                  }
                  className={`ins-page-dot ${
                    pageNumber === currentPage
                      ? 'is-current'
                      : ''
                  }`}>
                  {pageNumber}
                </Link>
              )
            }
          )}
        </nav>
      )}
      </div>
    </main>
  )
}

export default ArticleListPage
