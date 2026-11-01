// Insignificantia lists render summaries, never Notion blocks or cover assets.
// Return fresh objects so a cached database snapshot remains usable by articles.
const pick = (value, fields) => Object.fromEntries(
  fields.filter(key => value?.[key] !== undefined).map(key => [key, value[key]])
)
const summaryFields = [
  'id', 'slug', 'href', 'type', 'title', 'summary', 'category', 'tags',
  'publishDate', 'publishDay', 'date'
]

export function compactListPageData(props, theme, keepRandomNavigation = false) {
  if (theme !== 'insignificantia') return props
  const result = { ...props }
  if (Array.isArray(props.posts)) {
    result.posts = props.posts.map(post => pick(post, summaryFields))
    // The theme filters posts by year itself; the monthly copy is unused.
    delete result.archivePosts
  }
  if (Array.isArray(props.allNavPages)) {
    result.allNavPages = props.allNavPages.map(post =>
      pick(post, ['id', 'slug', 'href', 'title'])
    )
  }
  // Only the optional random-post context menu needs a site-wide post list.
  // Link conversion on list pages only needs destinations referenced by notice.
  if (!keepRandomNavigation) result.allNavPages = []
  const notice = JSON.stringify(props.notice || {}).replace(/-/g, '').toLowerCase()
  if (Array.isArray(props.allLinkPages)) {
    result.allLinkPages = props.allLinkPages.filter(post => {
      const ids = [post.id, post.short_id].filter(Boolean)
      return ids.some(id => notice.includes(String(id).replace(/-/g, '').toLowerCase()))
    })
  }
  return result
}
