import { paginationItems } from '@/lib/utils/pagination'

it('shows small page sets in full', () => {
  expect(paginationItems(1, 1)).toEqual([1])
  expect(paginationItems(7, 4)).toEqual([1, 2, 3, 4, 5, 6, 7])
})

it('keeps both edges and the current page with two neighbors', () => {
  expect(paginationItems(30, 15)).toEqual([1, 2, 3, 'ellipsis-3', 13, 14, 15, 16, 17, 'ellipsis-17', 28, 29, 30])
  expect(paginationItems(30, 1)).toEqual([1, 2, 3, 'ellipsis-3', 28, 29, 30])
  expect(paginationItems(30, 30)).toEqual([1, 2, 3, 'ellipsis-3', 28, 29, 30])
})

it('fills a single omitted page instead of inserting an ellipsis', () => {
  expect(paginationItems(12, 7)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
})

it('handles very large page counts without creating a page-sized array', () => {
  const items = paginationItems(1000000, 500000)
  expect(items).toHaveLength(13)
  expect(items).toContain(500000)
  expect(items[items.length - 1]).toBe(1000000)
})
