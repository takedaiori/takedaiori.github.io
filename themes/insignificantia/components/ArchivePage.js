import Link from 'next/link'
import { useRouter } from 'next/router'
import ArticleListPage from './ArticleListPage'

const normalizeOption = option => {
  if (!option) return { name: '', count: '' }

  if (typeof option === 'string') {
    return { name: option, count: '' }
  }

  return {
    name:
      option.name ||
      option.value ||
      option.label ||
      option.text ||
      '',
    count:
      option.count ||
      option.postCount ||
      option.num ||
      ''
  }
}

const extractYear = post => {
  const value =
    post?.publishDay ||
    post?.date ||
    post?.createdTime ||
    ''

  const match = String(value).match(/(19|20)\d{2}/)
  return match ? match[0] : ''
}

const categorySort = (a, b) => {
  const left = normalizeOption(a).name
  const right = normalizeOption(b).name

  const leftEnglish = /^[A-Za-z0-9]/.test(left)
  const rightEnglish = /^[A-Za-z0-9]/.test(right)

  if (leftEnglish !== rightEnglish) {
    return leftEnglish ? -1 : 1
  }

  return left.localeCompare(
    right,
    leftEnglish ? 'en' : 'zh-CN-u-co-pinyin',
    { sensitivity: 'base', numeric: true }
  )
}

const renderCategory = (option, index) => {
          const category = normalizeOption(option)
          if (!category.name) return null

          return (
            <Link
              key={`${category.name}-${index}`}
              href={`/category/${encodeURIComponent(
                category.name
              )}`}
              className='ins-archive-card'>
              <strong>{category.name}</strong>
              {category.count !== '' && (
                <small>{category.count} ARTICLES</small>
              )}
            </Link>
          )
        }

const ArchivePage = props => {
  const router = useRouter()
  const selectedYear = router?.query?.year
    ? String(router.query.year)
    : ''

  const posts = Array.isArray(props?.archivePosts)
    ? props.archivePosts
    : Array.isArray(props?.posts)
      ? props.posts
      : []

  if (selectedYear) {
    const filteredPosts = posts.filter(
      post => extractYear(post) === selectedYear
    )

    return (
      <ArticleListPage
        {...props}
        posts={filteredPosts}
        postCount={filteredPosts.length}
        kicker='ARCHIVE RESULT'
        contextLabel='YEAR'
        contextValue={selectedYear}
        makePageHref={pageNumber =>
          `/archive?year=${encodeURIComponent(
            selectedYear
          )}&p=${pageNumber}`
        }
      />
    )
  }

  const categories = Array.isArray(props?.categoryOptions)
    ? [...props.categoryOptions].sort(categorySort)
    : []

  const years = [
    ...new Set(
      posts
        .map(extractYear)
        .filter(Boolean)
    )
  ].sort((a, b) => Number(b) - Number(a))

  return (
    <main
      className='ins-archive-page'
      data-mobile-frame='archive-v1.10'
      style={{
        width: '100%',
        boxSizing: 'border-box'
      }}>
      <div
        data-safe-frame='archive-v1.11'
        style={{
          width: 'calc(100% - 40px)',
          maxWidth: '980px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box'
        }}>
      <header className='ins-archive-header'>
        <div className='ins-page-kicker'>ARCHIVE</div>
      </header>

      <section
        className='ins-archive-grid'
        aria-label='按分类浏览'>
        {categories.filter(option => normalizeOption(option).name !== 'WPD Archive').map(renderCategory)}
      </section>

      <section
        className='ins-archive-grid ins-archive-year-grid'
        aria-label='按年份浏览'>
        {years.map(year => (
          <Link
            key={year}
            href={`/archive?year=${year}`}
            className='ins-archive-card'>
            <strong>{year}</strong>
            <small>YEAR</small>
          </Link>
        ))}
        {categories.filter(option => normalizeOption(option).name === 'WPD Archive').map(renderCategory)}
      </section>
      </div>
    </main>
  )
}

export default ArchivePage
