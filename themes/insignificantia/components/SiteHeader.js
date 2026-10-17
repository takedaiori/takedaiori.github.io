import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import CONFIG from '../config'

const SiteHeader = () => {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const headerRef = useRef(null)
  const toggleRef = useRef(null)

  useEffect(() => {
    let lastY = Math.max(0, window.scrollY)
    let accumulated = 0
    let frame = 0
    const update = () => {
      frame = 0
      const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight))
      const delta = y - lastY
      lastY = y
      if (y <= 12) { accumulated = 0; setHidden(false); return }
      accumulated = Math.sign(delta) === Math.sign(accumulated) ? accumulated + delta : delta
      if (Math.abs(accumulated) >= 8) {
        const hide = accumulated > 0
        setHidden(hide)
        if (hide) setOpen(false)
        accumulated = 0
      }
    }
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); window.cancelAnimationFrame(frame) }
  }, [])

  useEffect(() => {
    if (!open) return
    const closeOutside = event => {
      if (!headerRef.current?.contains(event.target)) setOpen(false)
    }
    const closeEscape = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        if (headerRef.current?.contains(document.activeElement)) toggleRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside, true)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  return (
    <header ref={headerRef} className='ins-site-header' data-hidden={hidden} inert={hidden ? '' : undefined} aria-hidden={hidden || undefined} onFocusCapture={() => setHidden(false)}>
      <div className='ins-nav-inner'>
        <Link className='ins-brand' href='/' aria-label='Insignificantia. Home'>
          {CONFIG.INSIGNIFICANTIA_SITE_NAME}
        </Link>

        <nav className='ins-nav-links' aria-label='Primary navigation'>
          <Link href='/page/1'>ARTICLE</Link>
          <Link href='/archive'>ARCHIVE</Link>
          <Link href='/about'>ABOUT</Link>
        </nav>

        <button
          ref={toggleRef}
          className='ins-menu-toggle'
          type='button'
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls='ins-mobile-navigation'
          onClick={() => setOpen(value => !value)}>
          <span />
        </button>
      </div>

      <nav
        id='ins-mobile-navigation'
        className='ins-mobile-menu'
        data-open={open}
        hidden={!open}
        aria-label='Mobile navigation'>
        <Link href='/page/1' onClick={() => setOpen(false)}>
          ARTICLE
        </Link>
        <Link href='/archive' onClick={() => setOpen(false)}>
          ARCHIVE
        </Link>
        <Link href='/about' onClick={() => setOpen(false)}>
          ABOUT
        </Link>
      </nav>
    </header>
  )
}

export default SiteHeader
