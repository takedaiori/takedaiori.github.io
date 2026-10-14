import { render, screen } from '@testing-library/react'
import ArchivePage from '@/themes/insignificantia/components/ArchivePage'

jest.mock('next/router', () => ({ useRouter: () => ({ query: {} }) }))
jest.mock('next/link', () => {
  function MockLink({ children, ...props }) { return <a {...props}>{children}</a> }
  return { __esModule: true, default: MockLink }
})
jest.mock('@/themes/insignificantia/components/ArticleListPage', () => ({
  __esModule: true,
  default: () => null
}))

it('moves only WPD Archive after all years and preserves category and year ordering', () => {
  const categories = [{ name: 'Beta' }, { name: 'WPD Archive', count: 5 }, { name: 'Alpha' }]
  const { unmount } = render(<ArchivePage categoryOptions={categories} archivePosts={[
    { publishDay: '2023-01-01' },
    { publishDay: '2026-01-01' }
  ]} />)
  const links = screen.getAllByRole('link')
  expect(links.map(link => link.querySelector('strong').textContent)).toEqual(['Alpha', 'Beta', '2026', '2023', 'WPD Archive'])
  expect(links[4]).toHaveAttribute('href', '/category/WPD%20Archive')
  expect(categories.map(category => category.name)).toEqual(['Beta', 'WPD Archive', 'Alpha'])
  unmount()
})
