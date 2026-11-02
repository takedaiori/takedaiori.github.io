import { createCanonicalUrl } from '@/lib/sitemap-utils'
test('canonical identifies each actual page instead of collapsing pagination or pointing at github.io', () => {
  expect(createCanonicalUrl('https://takedaiori.github.io', '/category/WPD Archive/page/2?utm_source=test#section')).toBe('https://takedaiori.github.io/category/WPD%20Archive/page/2')
  expect(createCanonicalUrl('https://takedaiori.github.io', '/archive/year/2024/page/2')).toBe('https://takedaiori.github.io/archive/year/2024/page/2')
  expect(createCanonicalUrl('https://takedaiori.github.io', '/article/example')).toBe('https://takedaiori.github.io/article/example')
  expect(createCanonicalUrl('https://example.com/blog', '/tag/test/page/2')).toBe('https://example.com/blog/tag/test/page/2')
  for (const path of ['//evil.invalid/path', 'https://evil.invalid', '/\\evil.invalid', '/test\n']) expect(createCanonicalUrl('https://takedaiori.github.io', path)).toBeNull()
})
