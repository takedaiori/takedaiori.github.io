import Link from 'next/link'

const normalizeCategory = category => {
  if (!category) return ''
  if (typeof category === 'string') return category
  return category.name || category.value || category.text || ''
}

const getCategory = post => {
  if (Array.isArray(post?.category)) {
    return normalizeCategory(post.category[0])
  }

  return normalizeCategory(post?.category)
}

const getHref = post => {
  if (post?.href) return post.href
  if (post?.slug) return `/${post.slug}`
  return '#'
}

const PostCard = ({ post }) => {
  const href = getHref(post)
  const title = post?.title || 'Untitled'
  const category = getCategory(post)

  return (
    <Link
      href={href}
      className='ins-post-card'
      aria-label={`阅读：${title}`}>
      <div className='ins-post-meta'>
        {category && (
          <span className='ins-primary-tag'>
            {category}
          </span>
        )}
        <span>{post?.publishDay || post?.date || ''}</span>
      </div>

      <h2>{title}</h2>
      {post?.summary && <p>{post.summary}</p>}

      <div className='ins-post-card-footer'>
        <span className='ins-continue-reading'>继续阅读</span>
      </div>
    </Link>
  )
}

export default PostCard
