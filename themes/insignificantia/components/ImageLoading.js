import { useEffect } from 'react'

const ImageLoading = () => {
  useEffect(() => {
    const images = new Map()
    const refreshHost = host => {
      const pending = [...images].some(([image, state]) => state.host === host && state.pending)
      host.classList.toggle('ins-image-loading', pending)
      host.setAttribute('aria-busy', String(pending))
    }
    const watch = image => {
      if (!image.closest('.ins-carousel, .ins-portfolio-grid, .ins-notion-content, .ins-lightbox')) return
      if (images.has(image)) return
      const host = image.closest('.notion-asset-wrapper') || image.parentElement
      if (!host) return
      const originalPosition = host.style.position
      const positioned = window.getComputedStyle(host).position === 'static'
      if (positioned) host.style.position = 'relative'
      const state = { host, pending: false }
      const update = () => {
        state.pending = !image.complete || image.classList.contains('lazy-image-placeholder')
        refreshHost(host)
      }
      const finish = () => { state.pending = false; refreshHost(host) }
      state.update = update
      state.cleanup = () => { image.removeEventListener('load', update); image.removeEventListener('error', finish); if (positioned) host.style.position = originalPosition }
      images.set(image, state)
      image.addEventListener('load', update)
      image.addEventListener('error', finish)
      update()
    }
    const scan = () => {
      document.querySelectorAll('#theme-insignificantia img, .ins-lightbox img').forEach(watch)
      for (const [image, state] of images) {
        if (!image.isConnected) {
          state.cleanup(); images.delete(image); refreshHost(state.host)
        }
      }
    }
    scan()
    const observer = new MutationObserver(records => {
      let added = false
      for (const record of records) {
        if (record.type === 'childList') added = true
        else if (record.target.tagName === 'IMG') {
          watch(record.target)
          images.get(record.target)?.update()
        }
      }
      if (added) scan()
    })
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset', 'class'] })
    return () => {
      observer.disconnect()
      for (const state of images.values()) {
        state.cleanup(); state.host.classList.remove('ins-image-loading'); state.host.removeAttribute('aria-busy')
      }
    }
  }, [])
  return null
}

export default ImageLoading
