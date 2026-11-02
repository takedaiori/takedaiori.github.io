/** @jest-environment jsdom */
const fs = require('node:fs')
const vm = require('node:vm')
const source = fs.readFileSync(require('node:path').join(__dirname, '../../public/js/cusdis.es.js'), 'utf8')
function setup(dataset = {}) {
  const listeners = {}
  const media = { matches: false, addEventListener() {} }
  const context = { window: { matchMedia: () => media, addEventListener: (name, cb) => { listeners[name] = cb }, CUSDIS_PREVENT_INITIAL_RENDER: true }, document, URL, console }
  vm.createContext(context); vm.runInContext(source, context)
  const element = document.createElement('div')
  Object.assign(element.dataset, dataset)
  context.window.CUSDIS.renderTo(element)
  return { element, iframe: element.firstChild, listeners }
}
test('comment data cannot close an inline script; iframe has an isolated origin', () => {
  const { iframe } = setup({ pageTitle: '</script><script>alert(1)</script>' })
  expect(iframe.srcdoc).toContain('\\u003c/script>')
  expect(iframe.srcdoc).not.toContain('alert(1)</script>')
  expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-forms allow-popups')
})
test('only the comment frame can resize, with bounded numeric dimensions', () => {
  const { iframe, listeners } = setup()
  const send = (source, data) => listeners.message({ source, data: JSON.stringify({ from: 'cusdis', event: 'resize', data }) })
  send(window, 700); expect(iframe.style.height).toBe('')
  send(iframe.contentWindow, 50000); expect(iframe.style.height).toBe('')
  send(iframe.contentWindow, '500'); expect(iframe.style.height).toBe('')
  send(iframe.contentWindow, 500); expect(iframe.style.height).toBe('500px')
})
test('insecure hosts and scripts from another origin are rejected', () => {
  expect(() => setup({ host: 'http://example.com' })).toThrow('HTTPS')
  expect(() => setup({ host: 'https://example.com', iframe: 'https://other.example/script.js' })).toThrow('configured HTTPS host')
})

test('self-hosted Cusdis base paths are preserved', () => {
  const { iframe } = setup({ host: 'https://comments.example/widget/' })
  expect(iframe.srcdoc).toContain('https://comments.example/widget/js/iframe.umd.js')
  expect(iframe.srcdoc).toContain('https://comments.example/widget/js/style.css')
})
