import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import CONFIG from '../config'

const SLIDES = [
  {
    label: 'DESIGN / 01',
    className: 'ins-slide-one',
    src: '/images/insignificantia/hero/hero-01.webp'
  },
  {
    label: 'DESIGN / 02',
    className: 'ins-slide-two',
    src: '/images/insignificantia/hero/hero-02.webp'
  },
  {
    label: 'DESIGN / 03',
    className: 'ins-slide-three',
    src: '/images/insignificantia/hero/hero-03.webp'
  }
]

const Hero = () => {
  const [slideState, setSlideState] = useState({ current: 0, previous: null, direction: 'next' })
  const { current, previous, direction } = slideState
  const touch = useRef(null)
  const mouse = useRef(null)
  const [dragging, setDragging] = useState(false)

  const show = (index, requestedDirection) => {
    setSlideState(state => {
      const target = (index + SLIDES.length) % SLIDES.length
      if (target === state.current) return state
      return { current: target, previous: state.current, direction: requestedDirection || (target > state.current ? 'next' : 'prev') }
    })
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      // Do not rotate underneath a finger during a gesture.
      if (touch.current || mouse.current) return
      setSlideState(state => ({ current: (state.current + 1) % SLIDES.length, previous: state.current, direction: 'next' }))
    }, 7000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (previous === null) return undefined
    const timer = window.setTimeout(() => setSlideState(state => ({ ...state, previous: null })), 780)
    return () => window.clearTimeout(timer)
  }, [current, previous])

  const startTouch = event => {
    if (event.touches.length !== 1 || event.target.closest('button')) return
    touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  const endTouch = event => {
    const start = touch.current
    touch.current = null
    if (!start || !event.changedTouches[0]) return
    const dx = event.changedTouches[0].clientX - start.x
    const dy = event.changedTouches[0].clientY - start.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3) return
    show(current + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev')
  }

  const startMouseDrag = event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button')) return
    mouse.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    setDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }
  const cancelMouseDrag = () => {
    mouse.current = null
    setDragging(false)
  }
  const endMouseDrag = event => {
    const start = mouse.current
    if (!start || event.pointerId !== start.pointerId) return
    cancelMouseDrag()
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3) return
    show(current + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev')
  }

  return (
    <section className='ins-hero'>
      <div className='ins-hero-inner'>
        <div className='ins-hero-copy-column'>
          <div className='ins-hero-kicker'>{CONFIG.INSIGNIFICANTIA_HERO_KICKER}</div>
          <h1 className='ins-hero-title'>{CONFIG.INSIGNIFICANTIA_HERO_TITLE}</h1>
          <p className='ins-hero-copy'>
            {CONFIG.INSIGNIFICANTIA_HERO_DESCRIPTION}
          </p>
          <div className='ins-hero-actions'>
            <a className='ins-btn primary' href='#posts'>
              浏览文章
            </a>
            <Link className='ins-btn' href='/about'>
              关于这里
            </Link>
          </div>
        </div>

        <div className='ins-hero-visual'>
          <div
            className='ins-carousel'
            data-direction={direction}
            data-dragging={dragging}
            onPointerDown={startMouseDrag}
            onPointerUp={endMouseDrag}
            onPointerCancel={cancelMouseDrag}
            onLostPointerCapture={cancelMouseDrag}
            onTouchStart={startTouch}
            onTouchEnd={endTouch}
            onTouchCancel={() => { touch.current = null }}
            aria-label='视觉作品轮播'
            style={{ aspectRatio: '1 / 1' }}>
            <div className='ins-carousel-track'>
              {SLIDES.map((slide, index) => {
                const isActive = index === current
                const isLeaving = index === previous && !isActive
                return (
                  <div
                    key={slide.label}
                    className={`ins-slide ${slide.className} ${
                      isActive ? 'active' : ''
                    } ${isLeaving ? 'is-leaving' : ''}`}>
                    <img
                      src={slide.src}
                      alt={`Hero visual ${index + 1}`}
                      decoding='async'
                      draggable={false}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )
              })}
            </div>

            <button
              className='ins-carousel-arrow prev'
              type='button'
              aria-label='上一张'
              onClick={() => show(current - 1, 'prev')}>
              <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M15 5 8 12 15 19' />
              </svg>
            </button>
            <button
              className='ins-carousel-arrow next'
              type='button'
              aria-label='下一张'
              onClick={() => show(current + 1, 'next')}>
              <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='m9 5 7 7-7 7' />
              </svg>
            </button>

            <div className='ins-carousel-dots'>
              {SLIDES.map((slide, index) => (
                <button
                  key={slide.label}
                  className={`ins-carousel-dot ${
                    index === current ? 'active' : ''
                  }`}
                  type='button'
                  aria-label={`显示第 ${index + 1} 张轮播图`}
                  onClick={() => show(index)}
                />
              ))}
            </div>
          </div>

          <div className='ins-hero-symbols' aria-hidden='true'>
            <span>△</span>
            <span>○</span>
            <span>□</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero