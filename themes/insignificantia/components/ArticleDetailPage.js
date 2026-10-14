import Link from 'next/link'
import { useRef } from 'react'
import ArticleToc from './ArticleToc'
import NotionPage from '@/components/NotionPage'

const normalizeTag = tag => {
  if (!tag) return ''
  if (typeof tag === 'string') return tag
  return tag.name || tag.value || tag.text || ''
}

const getHref = post => {
  if (!post) return ''
  if (post.href) return post.href
  if (post.slug) return `/${post.slug}`
  return ''
}

const ArticleDetailPage = ({
  post,
  prev,
  next,
  toc: tocProp
}) => {
  const articleRef = useRef(null)

  if (!post) {
    return (
      <main className='ins-article-shell'>
        <div className='ins-article-loading'>
          Article not found.
        </div>
      </main>
    )
  }

  const toc = Array.isArray(tocProp)
    ? tocProp
    : Array.isArray(post?.toc)
      ? post.toc
      : []

  const tags = Array.isArray(post?.tagItems)
    ? post.tagItems.map(normalizeTag).filter(Boolean)
    : Array.isArray(post?.tags)
      ? post.tags.map(normalizeTag).filter(Boolean)
      : []

  return (
    <main
      className='ins-article-shell'
      data-mobile-frame='article-detail-v1.10'
      style={{
        width: '100%',
        boxSizing: 'border-box'
      }}>
      <div
        className='ins-article-safe-frame'
        data-safe-frame='article-detail-v1.11'
        style={{
          width: 'calc(100% - 40px)',
          maxWidth: '810px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box'
        }}>
      <header className='ins-article-header'>
        <div className='ins-article-date'>
          {post?.publishDay || post?.date || ''}
        </div>

        <h1 className='ins-article-title'>
          {post?.title || 'Untitled'}
        </h1>
      </header>

      <div className='ins-article-layout'>
        <article className='ins-article-body'>
<div ref={articleRef} className='ins-notion-content'>
            <NotionPage post={post} />
          </div>

          <footer className='ins-article-end'>
            {tags.length > 0 && (
              <div className='ins-tag-row'>
                {tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/tag/${encodeURIComponent(tag)}`}
                    className='ins-tag'>
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {(prev || next) && (
              <nav
                className='ins-post-nav'
                aria-label='上一篇与下一篇'>
                {prev ? (
                  <Link href={getHref(prev)}>
                    <span>上一篇</span>
                    <strong>{prev.title}</strong>
                  </Link>
                ) : (
                  <div />
                )}

                {next ? (
                  <Link href={getHref(next)}>
                    <span>下一篇</span>
                    <strong>{next.title}</strong>
                  </Link>
                ) : (
                  <div />
                )}
              </nav>
            )}
          </footer>
        </article>

        <ArticleToc items={toc} articleRef={articleRef} postId={post.id || post.slug} />
      </div>
      </div>
    </main>
  )
}

export default ArticleDetailPage
