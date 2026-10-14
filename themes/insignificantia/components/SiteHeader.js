import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import CONFIG from '../config'

const SiteHeader = () => {
  const [open, setOpen] = useState(false)
  const headerRef = useRef(null)
  const toggleRef = useRef(null)

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
    <header ref={headerRef} className='ins-site-header'>
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
