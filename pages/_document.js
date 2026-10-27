// eslint-disable-next-line @next/next/no-document-import-in-page
import BLOG from '@/blog.config'
import { imageRevealBootstrap, imageRevealStyle } from '@/lib/utils/imageRevealBootstrap'
import Document, { Head, Html, Main, NextScript } from 'next/document'

const isLocalFontAwesome = BLOG.FONT_AWESOME?.startsWith(
  '/vendor/fontawesome/'
)

const guideTransitionBootstrap = "(function(){try{var r=document.documentElement,k='insignificantia.guide.navigation.v2',m=JSON.parse(sessionStorage.getItem(k)||'null');if(m&&Date.now()-m.time<15000&&m.path===location.pathname+location.search){r.classList.add('ins-guide-arriving');r.dataset.insGuideMode=m.mode;if('scrollRestoration'in history)history.scrollRestoration='manual';setTimeout(function(){r.classList.remove('ins-guide-arriving')},6500)}}catch(e){}})()"
const guideTransitionStyle = 'html.ins-guide-arriving,html.ins-guide-leaving{background:#202d35}\nbody{transition:opacity 420ms ease}\nhtml.ins-guide-arriving body,html.ins-guide-leaving body{opacity:0!important;pointer-events:none}\nhtml.ins-guide-leaving body{transition:opacity 320ms ease}\nhtml.ins-guide-arriving .ins-page-enter{animation-play-state:paused}\nhtml[data-ins-guide-mode="return"] .ins-page-enter{animation:none!important}\nhtml[data-ins-guide-mode="guide"] body>.top,html[data-ins-guide-mode="guide"] body>main{animation:none!important}\nhtml.ins-guide-arriving .ins-site-header{transform:none!important;opacity:1!important}\n@media(prefers-reduced-motion:reduce){body,html.ins-guide-leaving body{transition:none!important}}\n'

// 预先设置深色模式的脚本内容
const darkModeScript = `
(function() {
  const darkMode = localStorage.getItem('darkMode')

  const prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

  const defaultAppearance = '${BLOG.APPEARANCE || 'auto'}'

  let shouldBeDark = darkMode === 'true' || darkMode === 'dark'

  if (darkMode === null) {
    if (defaultAppearance === 'dark') {
      shouldBeDark = true
    } else if (defaultAppearance === 'auto') {
      // 检查是否在深色模式时间范围内
      const date = new Date()
      const hours = date.getHours()
      const darkTimeStart = ${BLOG.APPEARANCE_DARK_TIME ? BLOG.APPEARANCE_DARK_TIME[0] : 18}
      const darkTimeEnd = ${BLOG.APPEARANCE_DARK_TIME ? BLOG.APPEARANCE_DARK_TIME[1] : 6}
      
      shouldBeDark = prefersDark || (hours >= darkTimeStart || hours < darkTimeEnd)
    }
  }
  
  // 立即设置 html 元素的类
  document.documentElement.classList.add(shouldBeDark ? 'dark' : 'light')
})()
`

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang={BLOG.LANG}>
        <Head>
          <style dangerouslySetInnerHTML={{ __html: guideTransitionStyle }} />
          <script dangerouslySetInnerHTML={{ __html: guideTransitionBootstrap }} />
          <style dangerouslySetInnerHTML={{ __html: imageRevealStyle }} />
          <script dangerouslySetInnerHTML={{ __html: imageRevealBootstrap }} />
          <script src='/image-reveal.js' defer />
          <script src='/design-guide-transition.js' defer />
          <link rel='preconnect' href='https://images.unsplash.com' />
          <link rel='dns-prefetch' href='//images.unsplash.com' />

          {/* 预加载字体 */}
          {BLOG.FONT_AWESOME && (
            <>
              {isLocalFontAwesome && (
                <>
                  <link
                    rel='preload'
                    href='/vendor/fontawesome/webfonts/fa-solid-900.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                  />
                  <link
                    rel='preload'
                    href='/vendor/fontawesome/webfonts/fa-regular-400.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                  />
                  <link
                    rel='preload'
                    href='/vendor/fontawesome/webfonts/fa-brands-400.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                  />
                </>
              )}
              <style
                dangerouslySetInnerHTML={{
                  __html:
                    '.fa,.fas,.far,.fab,.fa-solid,.fa-regular,.fa-brands{display:inline-flex;width:1.25em;min-width:1.25em;height:1em;align-items:center;justify-content:center;text-align:center;line-height:1}'
                }}
              />
              <link
                id='font-awesome-css'
                rel='preload'
                as='style'
                href={BLOG.FONT_AWESOME}
              />
              <script
                dangerouslySetInnerHTML={{
                  __html:
                    "requestAnimationFrame(function(){var l=document.getElementById('font-awesome-css');if(l)l.rel='stylesheet'})"
                }}
              />
              <noscript>
                <link rel='stylesheet' href={BLOG.FONT_AWESOME} />
              </noscript>
            </>
          )}

          {/* 预先设置深色模式，避免闪烁 */}
          <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
