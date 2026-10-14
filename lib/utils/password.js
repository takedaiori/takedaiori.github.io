import { sha256 } from 'js-sha256'
import { isBrowser } from '.'

/** SHA256(hex)，用于文章锁新版存储（明文仅存在于 Notion，同步后为摘要） */
export const sha256Digest = str => sha256(String(str))

/** Notion 密码字段直接填入的预计算 SHA256（64 位 hex） */
export const isSHA256Digest = str =>
  typeof str === 'string' && /^[a-fA-F0-9]{64}$/.test(str.trim())

/** 旧版 md5(slug+明文) 的 32 位 hex，同步回字段时原样保留 */
export const isMd5Digest = str =>
  typeof str === 'string' && /^[a-fA-F0-9]{32}$/.test(str.trim())

/**
 * 与 getPasswordQuery 中 localStorage 键一致：pathname only，不含 ?query / #hash
 * （修复带查询参数或锚点时读写键不一致导致无法自动解锁，见 PR #3389）
 */
export const getPasswordStoragePath = path => {
  if (!path) {
    return '/'
  }
  try {
    const base =
      isBrowser && typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost'
    return new URL(path, base).pathname || '/'
  } catch {
    return String(path).split(/[?#]/)[0] || '/'
  }
}

/** Read a URL password for this attempt only; never persist credentials. */
export const getPasswordQuery = path => {
  if (!isBrowser || typeof window === 'undefined') return []
  const url = new URL(path, window.location.origin)
  // Remove plaintext credentials saved by older versions.
  try {
    const obsoleteKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('password_')) obsoleteKeys.push(key)
    }
    obsoleteKeys.forEach(key => localStorage.removeItem(key))
  } catch {
    // Storage can be disabled by the browser; URL input still works.
  }
  const password = url.searchParams.get('password')
  if (password) {
    url.searchParams.delete('password')
    window.history.replaceState(window.history.state, '',
      url.pathname + url.search + url.hash)
  }
  return password ? [password] : []
}
