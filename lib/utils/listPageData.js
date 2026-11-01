// Insignificantia lists render summaries, never Notion blocks or cover assets.
// Return fresh objects so a cached database snapshot remains usable by articles.
const pick = (value, fields) => Object.fromEntries(
  fields.filter(key => value?.[key] !== undefined).map(key => [key, value[key]])
)
const summaryFields = [
  'id', 'slug', 'href', 'type', 'title', 'summary', 'category', 'tags',
  'publishDate', 'publishDay', 'date'
]

export function compactListPageData(props, theme) {
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
  // allLinkPages is retained for Notion link conversion, including notices.
  return result
}
