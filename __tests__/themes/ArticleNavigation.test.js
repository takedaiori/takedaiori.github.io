import { render, screen } from '@testing-library/react'
import ArticleDetailPage from '@/themes/insignificantia/components/ArticleDetailPage'
import { buildReadingNavigation } from '@/lib/utils/readingNavigation'
const mockQuery = {}
jest.mock('next/router', () => ({ useRouter: () => ({ query: mockQuery }) }))
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => <a {...props}>{children}</a> }))
jest.mock('@/components/NotionPage', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('@/themes/insignificantia/components/ArticleToc', () => ({ __esModule: true, default: () => null }))
const pages = ['2024', '2025', '2026'].map(year => ({ slug: `article/${year}`, title: year, publishDay: `${year}-01-01`, type: 'Post', status: 'Published', category: 'C', tags: ['T'] }))

test('renders newer first and older second and preserves collection on both links', () => {
 mockQuery.reading = 'category'; mockQuery.collection = 'C'
 const { container, unmount } = render(<ArticleDetailPage post={pages[1]} readingNavigation={buildReadingNavigation(pages, pages[1])} />)
 const links = container.querySelectorAll('.ins-post-nav a')
 expect(links[0]).toHaveTextContent('下一篇2026')
 expect(links[1]).toHaveTextContent('上一篇2024')
 expect(links[0].getAttribute('href')).toBe('/article/2026?reading=category&collection=C')
 expect(screen.getByText('CATEGORY · C')).toBeInTheDocument()
 unmount()
})
