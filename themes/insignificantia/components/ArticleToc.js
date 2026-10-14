import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const normalizeId = value =>
  String(value || '').replace(/^#/, '').replace(/^notion-block-/, '').replace(/-/g, '').toLowerCase()

export const findTocTarget = (root, id) => {
  if (!root || !id) return null
  const key = normalizeId(id)
  const identified = Array.from(root.querySelectorAll('[id]'))
    .find(node => normalizeId(node.id) === key)
  if (identified) return identified
  return Array.from(root.getElementsByClassName('notion-block-' + key))[0] || null
}

const ArticleToc = ({ items, articleRef, postId }) => {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const dockRef = useRef(null)
  const triggerRef = useRef(null)
  const pinnedRef = useRef(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    pinnedRef.current = false
    setOpen(false)
  }, [postId])

  useEffect(() => {
    if (!open) return
    const closeOutside = event => {
      if (!dockRef.current?.contains(event.target)) {
        pinnedRef.current = false
        setOpen(false)
      }
    }
    const closeEscape = event => {
      if (event.key === 'Escape') {
        if (dockRef.current?.contains(document.activeElement)) triggerRef.current?.focus()
        pinnedRef.current = false
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOutside, true)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  const entries = items.filter(item => item?.text || item?.title || item?.value)
  if (!mounted || !entries.length) return null

  const jumpTo = (event, item) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    pinnedRef.current = true
    setOpen(true)
    const id = item.id || item.blockId || item.uuid
    const root = articleRef.current
    let target = findTocTarget(root, id)
    if (!target && root) {
      const title = String(item.text || item.title || item.value).trim()
      target = Array.from(root.querySelectorAll('h1, h2, h3, h4, .notion-h1, .notion-h2, .notion-h3, .notion-h4'))
        .find(node => node.textContent.trim() === title)
    }
    if (!target) return
    event.preventDefault()
    const hash = target.id || normalizeId(id)
    if (hash) window.history.replaceState(window.history.state, '', '#' + encodeURIComponent(hash))
    target.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    })
  }

  return createPortal(
    <aside
      ref={dockRef}
      className='ins-reading-toc'
      style={{ '--ins-toc-count': entries.length }}
      data-open={open}
      onPointerEnter={event => {
        if (event.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={event => {
        if (event.pointerType === 'mouse' && !pinnedRef.current && !dockRef.current?.contains(document.activeElement)) setOpen(false)
      }}
      onBlur={event => {
        if (!pinnedRef.current && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}>
      <div className='ins-reading-toc-trigger'>
        <div className='ins-reading-toc-marks'>
          {entries.map((item, index) => {
            const id = item.id || item.blockId || item.uuid || ''
            const title = item.text || item.title || item.value
            return (
              <a
                key={id || index}
                ref={index === 0 ? triggerRef : undefined}
                className='ins-reading-toc-mark'
                href={id ? '#' + normalizeId(id) : '#'}
                aria-label={'跳转至：' + title}
                aria-expanded={open}
                aria-controls='ins-reading-toc-list'
                onFocus={() => setOpen(true)}
                onClick={event => jumpTo(event, item)}>
                <span aria-hidden='true' />
              </a>
            )
          })}
        </div>
      </div>
      {open && (
        <nav id='ins-reading-toc-list' className='ins-reading-toc-panel' aria-label='文章目录'>
          {entries.map((item, index) => {
            const id = item.id || item.blockId || item.uuid || ''
            return (
              <a
                key={id || index}
                href={id ? '#' + normalizeId(id) : '#'}
                className={Number(item.indentLevel ?? item.level ?? 0) > 0 ? 'is-sub' : ''}
                onClick={event => jumpTo(event, item)}>
                {item.text || item.title || item.value}
              </a>
            )
          })}
        </nav>
      )}
    </aside>,
    document.body
  )
}

export default ArticleToc
