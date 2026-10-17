// Keep the first/last page and two neighbors at each edge and around the current page.
export function paginationItems(totalPages, currentPage) {
  const total = Math.max(1, Math.floor(Number(totalPages) || 1))
  const current = Math.max(1, Math.min(total, Math.floor(Number(currentPage) || 1)))
  const visible = new Set()
  for (let offset = 0; offset <= 2; offset++) {
    visible.add(1 + offset)
    visible.add(total - offset)
    visible.add(current - offset)
    visible.add(current + offset)
  }
  const pages = [...visible].filter(page => page >= 1 && page <= total).sort((a, b) => a - b)
  const result = []
  for (const page of pages) {
    const previous = result[result.length - 1]
    if (typeof previous === 'number' && page - previous === 2) result.push(previous + 1)
    else if (typeof previous === 'number' && page - previous > 2) result.push('ellipsis-' + previous)
    result.push(page)
  }
  return result
}
