import Link from 'next/link'
import { useEffect, useState } from 'react'
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
  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState(null)

  const show = index => {
    const next = (index + SLIDES.length) % SLIDES.length
    if (next === current) return
    setPrevious(current)
    setCurrent(next)
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent(value => {
        setPrevious(value)
        return (value + 1) % SLIDES.length
      })
    }, 7000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (previous === null) return undefined
    const timer = window.setTimeout(() => {
      setPrevious(null)
    }, 780)
    return () => window.clearTimeout(timer)
  }, [current, previous])

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
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: 'cover'
                      }}
                    />
                    <span className='ins-slide-label'>{slide.label}</span>
                  </div>
                )
              })}
            </div>

            <button
              className='ins-carousel-arrow prev'
              type='button'
              aria-label='上一张'
              onClick={() => show(current - 1)}>
              ‹
            </button>
            <button
              className='ins-carousel-arrow next'
              type='button'
              aria-label='下一张'
              onClick={() => show(current + 1)}>
              ›
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