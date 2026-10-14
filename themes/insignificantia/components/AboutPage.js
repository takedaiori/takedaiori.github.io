import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const SOCIALS = [
  {
    name: 'X',
    href: 'https://x.com/',
    icon: (
      <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z' />
    )
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/',
    icon: (
      <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z' />
    )
  },
  {
    name: 'GitHub',
    href: 'https://github.com/',
    icon: (
      <path d='M12 .297a12 12 0 0 0-3.79 23.39c.6.111.82-.26.82-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.071 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 6.103c1.02.005 2.047.138 3.005.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.769.84 1.233 1.911 1.233 3.221 0 4.61-2.806 5.624-5.479 5.921.43.372.814 1.102.814 2.222v3.293c0 .32.218.694.825.576A12 12 0 0 0 12 .297Z' />
    )
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    icon: (
      <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM3.559 20.452h3.556V9H3.559v11.452Z' />
    )
  },
  {
    name: 'RSS',
    href: '/rss/feed.xml',
    icon: (
      <>
        <circle cx='5.25' cy='18.75' r='2.25' />
        <path d='M3 10.1v3.15A7.75 7.75 0 0 1 10.75 21h3.15C13.9 14.98 9.02 10.1 3 10.1Z' />
        <path d='M3 3v3.15C11.2 6.15 17.85 12.8 17.85 21H21C21 11.06 12.94 3 3 3Z' />
      </>
    )
  },
  {
    name: 'Medium',
    href: 'https://medium.com/',
    icon: (
      <>
        <circle cx='6.5' cy='12' r='6.5' />
        <ellipse cx='17' cy='12' rx='3.25' ry='6' />
        <ellipse cx='22.5' cy='12' rx='1.5' ry='5.25' />
      </>
    )
  },
  {
    name: 'WordPress',
    href: 'https://wordpress.com/',
    icon: (
      <g transform='scale(1.2)'>
        <path d='M20 10c0-5.52-4.48-10-10-10s-10 4.48-10 10 4.48 10 10 10 10-4.48 10-10zM10 1.010c4.97 0 8.99 4.020 8.99 8.99s-4.020 8.99-8.99 8.99-8.99-4.020-8.99-8.99 4.020-8.99 8.99-8.99zM8.010 14.82l-3.050-8.21c0.49-0.030 1.050-0.080 1.050-0.080 0.43-0.050 0.38-1.010-0.060-0.99 0 0-1.29 0.1-2.13 0.1-0.15 0-0.33 0-0.52-0.010 1.44-2.17 3.9-3.6 6.7-3.6 2.090 0 3.99 0.79 5.41 2.090-0.6-0.080-1.45 0.35-1.45 1.42 0 0.66 0.38 1.22 0.79 1.88 0.31 0.54 0.5 1.22 0.5 2.21 0 1.34-1.27 4.48-1.27 4.48l-2.71-7.5c0.48-0.030 0.75-0.16 0.75-0.16 0.43-0.050 0.38-1.1-0.050-1.080 0 0-1.3 0.11-2.14 0.11-0.78 0-2.11-0.11-2.11-0.11-0.43-0.020-0.48 1.060-0.050 1.080l0.84 0.080 1.12 3.040zM14.030 16.97l2.61-6.97s0.67-1.69 0.39-3.81c0.63 1.14 0.94 2.42 0.94 3.81 0 2.96-1.56 5.58-3.94 6.97zM2.68 6.77l3.82 10.48c-2.67-1.3-4.47-4.080-4.47-7.25 0-1.16 0.2-2.23 0.65-3.23zM10.13 11.3l2.29 6.25c-0.75 0.27-1.57 0.42-2.42 0.42-0.72 0-1.41-0.11-2.060-0.3z' />
      </g>
    )
  },
  {
    name: 'Buy Me a Coffee',
    href: 'https://www.buymeacoffee.com/',
    icon: (
      <path d='M5 4h12v3h1.25A3.75 3.75 0 0 1 22 10.75v.5A3.75 3.75 0 0 1 18.25 15H17v1a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V4Zm12 5v4h1.25A1.75 1.75 0 0 0 20 11.25v-.5A1.75 1.75 0 0 0 18.25 9H17ZM7 6v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6H7ZM4 22h14v2H4v-2Z' />
    )
  }
]

const PORTFOLIO = [
  {
    id: 1,
    title: "Senua's Saga: Hellblade II",
    src: '/images/insignificantia/portfolio/work-01.webp'
  },
  {
    id: 2,
    title: "Mirror's Edge Catalyst",
    src: '/images/insignificantia/portfolio/work-02.webp'
  },
  {
    id: 3,
    title: 'Call of Duty: Modern Warfare 2019',
    src: '/images/insignificantia/portfolio/work-03.webp'
  },
  {
    id: 4,
    title: "Marvel's Spider-Man",
    src: '/images/insignificantia/portfolio/work-04.webp'
  },
  {
    id: 5,
    title: 'CONTROL',
    src: '/images/insignificantia/portfolio/work-05.webp'
  },
  {
    id: 6,
    title: 'The Last of Us Part II',
    src: '/images/insignificantia/portfolio/work-06.webp'
  },
  {
    id: 7,
    title: 'DRIVECLUB BIKES',
    src: '/images/insignificantia/portfolio/work-07.webp'
  },
  {
    id: 8,
    title: 'DIRT 5',
    src: '/images/insignificantia/portfolio/work-08.webp'
  },
  {
    id: 9,
    title: 'MotoGP 22',
    src: '/images/insignificantia/portfolio/work-09.webp'
  },
  {
    id: 10,
    title: 'Black Myth Wukong',
    src: '/images/insignificantia/portfolio/work-10.webp'
  },
  {
    id: 11,
    title: 'DEATH STRANDING',
    src: '/images/insignificantia/portfolio/work-11.webp'
  },
  {
    id: 12,
    title: 'SCARLET NEXUS',
    src: '/images/insignificantia/portfolio/work-12.webp'
  }
]

const AboutPage = () => {
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setLightbox(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () =>
      window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <main className='ins-about-page'>
      <header className='ins-about-header'>
        <div className='ins-page-kicker'>ABOUT</div>
        <div className='ins-about-intro'>
          <p>读者你好，我是竹田伊織，Insignificantia. 的博主。</p>
          <p>Insignificantia. 采用NotionNext开源后端，ChatGPT负责前端开发，Github用于静态托管。</p>
          <p>我个人感兴趣的方向是游戏摄影，模拟驾驶，游戏行业深度洞察，科技数码，智能化企业，AI，跑鞋，以及最重要的：厨艺。这些内容你几乎都可以在这个博客站点中找到。</p>
          <p>这里的文章有的由我本人完全手打，也有AI辅助或直接参与的内容。以2025年为分界线。</p>
          <p>下方是我的社媒链接，和游戏摄影作品集。</p>
          <p>若内容对你有帮助，请BUY ME A COFFEE（社媒链接中的杯子图标）。谢谢你的支持！</p>
        </div>
      </header>

      <section
        className='ins-social-strip'
        aria-label='社交媒体'>
        {SOCIALS.map(item => (
          <a
            key={item.name}
            href={item.href}
            className='ins-social-link'
            aria-label={item.name}
            target='_blank'
            rel='noreferrer'>
            <svg
              viewBox='0 0 24 24'
              aria-hidden='true'>
              {item.icon}
            </svg>
          </a>
        ))}
      </section>

      <section aria-label='VIRTUAL PHOTOGRAPHY GALLERY'>
        <div className='ins-portfolio-kicker ins-page-kicker'>
          VIRTUAL PHOTOGRAPHY GALLERY
        </div>

        <div className='ins-portfolio-grid'>
          {PORTFOLIO.map(item => (
            <article
              key={item.id}
              className='ins-portfolio-item'>
              <button
                type='button'
                className={`ins-portfolio-card ins-portfolio-placeholder-${(
                  (item.id - 1) %
                  4
                ) + 1}`}
                onClick={() =>
                  setLightbox(item)
                }
                aria-label={`预览 ${item.title}`}>
                {item.src ? (
                  <img
                    src={item.src}
                    alt={item.title}
                    loading='lazy'
                    decoding='async'
                  />
                ) : (
                  <span className='ins-portfolio-number'>
                    {String(item.id).padStart(2, '0')}
                  </span>
                )}
              </button>

              <p>
                <strong>{item.title}</strong>
              </p>
            </article>
          ))}
        </div>
      </section>

      {lightbox && createPortal(
        <div
          className='ins-lightbox'
          role='dialog'
          aria-modal='true'
          aria-label={lightbox.title}
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setLightbox(null)
            }
          }}>
          <div className='ins-lightbox-dialog'>
            <button
              type='button'
              className='ins-lightbox-close'
              aria-label='关闭预览'
              onClick={() =>
                setLightbox(null)
              }>
              ×
            </button>

            <div
              className={`ins-lightbox-image ins-portfolio-placeholder-${(
                (lightbox.id - 1) %
                4
              ) + 1}`}>
              {lightbox.src ? (
                <img
                  src={lightbox.src}
                  alt={lightbox.title}
                  decoding='async'
                />
              ) : (
                <span>
                  {String(
                    lightbox.id
                  ).padStart(2, '0')}
                </span>
              )}
            </div>

            <p>
              <strong>{lightbox.title}</strong>
            </p>
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}

export default AboutPage
