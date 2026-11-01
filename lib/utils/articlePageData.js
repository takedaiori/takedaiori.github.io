// Keep the rendered article intact. Only remove site-wide indexes and unused
// recommendations from the Insignificantia detail payload.
const renderedReferences = post => {
  const map = post?.blockMap
  if (!map) return ''
  // Collection-view metadata can contain IDs of the whole database. Only use
  // rendered block properties, page/alias targets and actual query results.
  const blocks = Object.values(map.block || {}).map(wrapper => {
    const value = wrapper.value || wrapper
    return [value.properties, value.text, value.type === 'page' ? value.id : null, value.format?.alias_pointer]
  })
  return JSON.stringify([blocks, map.collection_query || {}])
}

export function compactArticlePageData(props, theme, keepRandomNavigation = false) {
  if (theme !== 'insignificantia' || !props.post) return props
  const result = { ...props }
  result.allNavPages = keepRandomNavigation
    ? (props.allNavPages || []).map(page => Object.fromEntries(
      ['id', 'slug', 'href', 'title'].filter(key => page[key] !== undefined).map(key => [key, page[key]])
    ))
    : []
  const references = [renderedReferences(props.post), renderedReferences(props.notice)].join('').replace(/-/g, '').toLowerCase()
  result.allLinkPages = (props.allLinkPages || []).filter(page =>
    [page.id, page.short_id].filter(Boolean).some(id =>
      references.includes(String(id).replace(/-/g, '').toLowerCase())
    )
  ).map(({ id, short_id, href, slug }) => {
    const link = { id, short_id, href, slug }
    return Object.fromEntries(Object.entries(link).filter(([, value]) => value !== undefined))
  })
  delete result.recommendPosts
  return result
}
