import { isSafeResourceUrl, isSafeScriptUrl } from '@/lib/security/resourcePolicy'

describe('resource URL protocol boundary', () => {
  const origin = 'https://blog.example'
  test.each(['javascript:alert(1)', 'data:text/javascript,alert(1)', 'http://cdn.example/a.js', 'https://user:pass@cdn.example/a.js'])('blocks %s', url => {
    expect(isSafeResourceUrl(url, origin)).toBe(false)
  })
  test.each(['/js/a.js', 'https://cdn.example/a.js'])('allows %s', url => {
    expect(isSafeResourceUrl(url, origin)).toBe(true)
  })
})

 test('remote scripts require a reviewed CDN and pinned version', () => {
  const origin = 'https://blog.example'
  expect(isSafeScriptUrl('https://attacker.example/a.js', origin)).toBe(false)
  expect(isSafeScriptUrl('https://cdn.jsdelivr.net/npm/hls.js@latest', origin)).toBe(false)
  expect(isSafeScriptUrl('https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js', origin)).toBe(true)
  expect(isSafeScriptUrl('https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.0/mermaid.min.js', origin)).toBe(true)
 })
