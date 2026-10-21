'use strict'
// Persist only authenticated ciphertext. Never upload raw Notion records or compiled server data.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const zlib = require('node:zlib')
const root = path.resolve('.next/cache')
const file = '.build-cache/cache.enc'
const key = Buffer.from(process.env.BUILD_CACHE_KEY || '', 'hex')
const mode = process.argv[2]
if (key.length !== 32 || !/^[a-f0-9]{64}$/i.test(process.env.BUILD_CACHE_KEY || '')) {
  console.log('Encrypted build cache disabled: configure BUILD_CACHE_KEY as 64 hex characters.')
  process.exit(0)
}
function allowed(rel) {
  if (rel.startsWith('webpack/')) return true
  if (!/^notion\/data\/[a-zA-Z0-9_.-]+\.json$/.test(rel)) return false
  return true
}
if (mode === 'save') {
  const entries = []
  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isSymbolicLink()) continue
      if (e.isDirectory()) { walk(p); continue }
      const rel = path.relative(root, p).split(path.sep).join('/')
      if (!allowed(rel)) continue
      if (rel.startsWith('notion/')) {
        try {
          const record = JSON.parse(fs.readFileSync(p, 'utf8'))
          if (!/^page_block_.+_\d{10,}$/.test(record.key || '')) continue
          // Limit reuse age even when last-edited timestamps fail to reflect a nested edit.
          if (!Number.isFinite(record.updatedAt) || Date.now() - record.updatedAt > 6 * 60 * 60 * 1000) continue
        } catch { continue }
      }
      entries.push([rel, fs.readFileSync(p).toString('base64')])
    }
  }
  walk(path.join(root, 'webpack')); walk(path.join(root, 'notion/data'))
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const body = Buffer.concat([cipher.update(zlib.gzipSync(JSON.stringify({ time: Date.now(), entries }))), cipher.final()])
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, Buffer.concat([Buffer.from('NBC1'), iv, cipher.getAuthTag(), body]))
  console.log(`Encrypted cache saved: ${entries.length} files`)
} else if (mode === 'restore') {
  try {
    const buf = fs.readFileSync(file)
    if (buf.subarray(0, 4).toString() !== 'NBC1') throw Error('format')
    const dec = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(4, 16))
    dec.setAuthTag(buf.subarray(16, 32))
    const payload = JSON.parse(zlib.gunzipSync(Buffer.concat([dec.update(buf.subarray(32)), dec.final()])))
    if (Date.now() - payload.time > 6 * 60 * 60 * 1000) throw Error('expired')
    let count = 0
    for (const [rel, value] of payload.entries) {
      if (!allowed(rel) || rel.includes('..') || path.isAbsolute(rel)) throw Error('path')
      if (rel.startsWith('notion/')) {
        const record = JSON.parse(Buffer.from(value, 'base64').toString())
        if (!/^page_block_.+_\d{10,}$/.test(record.key || '') ||
            !Number.isFinite(record.updatedAt) ||
            Date.now() - record.updatedAt > 6 * 60 * 60 * 1000 ||
            (record.expireTime && record.expireTime <= Date.now())) continue
      }
      const p = path.join(root, rel)
      fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.from(value, 'base64')); count++
    }
    console.log(`Encrypted cache restored: ${count} files`)
  } catch {
    fs.rmSync(root, { recursive: true, force: true })
    console.log('No valid recent encrypted cache; using a clean build.')
  }
} else throw Error('Use restore or save')
