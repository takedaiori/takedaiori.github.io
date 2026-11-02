/** @jest-environment node */
const path = require('node:path')
test('legacy tooling retains the function API and brace expansion', () => {
  const legacy = require('minimatch')
  expect(typeof legacy).toBe('function')
  expect(legacy('src/a.js', '{src,test}/**/*.js')).toBe(true)
  expect(legacy('docs/a.md', '{src,test}/**/*.js')).toBe(false)
})
test('both TypeScript parser chains use the fixed named API with working brace expansion', () => {
  const parser = path.dirname(require.resolve('@typescript-eslint/parser/package.json'))
  const nextConfig = path.dirname(require.resolve('eslint-config-next/package.json'))
  for (const owner of [parser, nextConfig]) {
    const estree = path.dirname(require.resolve('@typescript-eslint/typescript-estree/package.json', { paths: [owner] }))
    const matcher = require(require.resolve('minimatch', { paths: [estree] }))
    const version = require(require.resolve('minimatch/package.json', { paths: [estree] })).version
    expect(version).toBe('11.0.4')
    expect(new matcher.Minimatch('{src,test}/**/*.ts', { optimizationLevel: 2 }).match('src/deep/file.ts')).toBe(true)
    expect(matcher.minimatch('docs/file.md', '{src,test}/**/*.ts')).toBe(false)
  }
})
