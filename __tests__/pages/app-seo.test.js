import { render } from '@testing-library/react'
import MyApp from '@/pages/_app'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('@/hooks/useAdjustStyle', () => () => {})
jest.mock('@/components/ExternalPlugins', () => () => null)
jest.mock('@/components/PWAInstaller', () => () => null)
jest.mock('@/lib/utils/errorHandler', () => ({
  createErrorBoundary: () => ({ children }) => <>{children}</>
}))
jest.mock('@/lib/global', () => ({
  GlobalContextProvider: ({ children }) => <>{children}</>,
  useGlobal: () => ({
    locale: { COMMON: { CATEGORY: '分类', TAGS: '标签' }, NAV: {} }
  })
}))
jest.mock('@/themes/theme', () => ({
  // A dynamic theme may show its loading state without rendering children.
  getBaseLayoutByTheme: () => () => <div data-testid='theme-loading' />
}))
jest.mock('@/lib/utils', () => ({
  getQueryParam: () => '',
  isHttpLink: value => /^https?:\/\//.test(value),
  loadExternalResource: jest.fn()
}))
jest.mock('@/lib/config', () => ({
  siteConfig: (key, fallback) => ({
    LINK: 'https://takedaiori.github.io',
    PATH: '', SUB_PATH: '', FONT_URL: '', LANG: 'zh-CN', TITLE: 'Insignificantia.'
  }[key] ?? fallback)
}))

describe('metadata during dynamic theme loading', () => {
  it.each([
    ['/category/[category]', { category: '知行合一' }, '/category/知行合一'],
    ['/tag/[tag]', { tag: '工具' }, '/tag/工具']
  ])('keeps canonical and Open Graph metadata for %s', (route, fields, path) => {
    useRouter.mockReturnValue({ route, pathname: route, asPath: path, query: fields })
    const { container } = render(<MyApp Component={() => null} pageProps={{
      ...fields,
      siteInfo: { title: 'Insignificantia.', description: 'Blog', pageCover: '/cover.png' }
    }} />)
    expect(container.querySelector('[data-testid="theme-loading"]')).toBeInTheDocument()
    expect(container.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href', `https://takedaiori.github.io${path}`
    )
    expect(container.querySelector('meta[property="og:url"]')).toHaveAttribute(
      'content', `https://takedaiori.github.io${path}`
    )
  })
})
