/** @jest-environment node */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

test('Sucrase project CLI still expands nested TypeScript include patterns after its glob security update', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sucrase-security-'))
  try {
    fs.mkdirSync(path.join(root, 'src/nested'), { recursive: true })
    fs.writeFileSync(path.join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { outDir: 'dist', module: 'commonjs', target: 'ES2020' }, include: ['src/**/*.ts'] }))
    fs.writeFileSync(path.join(root, 'src/answer.ts'), 'export const answer: number = 42;')
    fs.writeFileSync(path.join(root, 'src/nested/second.ts'), 'export const second: string = "ok";')
    fs.writeFileSync(path.join(root, 'src/ignored.d.ts'), 'declare const typeOnly: string;')
    const result = spawnSync(process.execPath, [path.resolve('node_modules/sucrase/bin/sucrase'), '--project', '.'], { encoding: 'utf8', cwd: root })
    if (result.status !== 0) throw new Error(result.stderr + result.stdout)
    expect(result.status).toBe(0)
    expect(fs.readFileSync(path.join(root, 'dist/src/answer.js'), 'utf8')).toContain('42')
    expect(fs.existsSync(path.join(root, 'dist/src/nested/second.js'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'dist/src/ignored.d.js'))).toBe(false)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
