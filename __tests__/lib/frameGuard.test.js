/** @jest-environment node */
const fs = require('node:fs')
const { frameGuardScript, headMarkup, bodyMarkup } = require('../../lib/security/frameGuard.cjs')
test('standalone active pages use the same early frame protection as the document', () => {
  for (const name of ['design-guide.html', 'content-rights.html', 'privacy.html']) {
    const html = fs.readFileSync('public/' + name, 'utf8')
    expect(html).toContain(headMarkup)
    expect(html).toContain(bodyMarkup)
    expect(html.indexOf(headMarkup)).toBeLessThan(html.indexOf('<body'))
  }
})
test('guard has no top-navigation dependency or configurable executable input', () => {
  expect(frameGuardScript).not.toMatch(/top\.location|eval\(|new Function/)
  expect(frameGuardScript).toContain('window.self===window.top')
})
