/* Full-document navigation between the blog and its static design guide. */
;(function () {
  'use strict'
  var root = document.documentElement
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  var key = 'insignificantia.guide.navigation.v2'
  var entryKey = 'insignificantia.guide.entry.v2'
  var guidePath = '/design-guide'
  var leaving = false
  var prefetched = null
  function isGuide(path) { return /^\/design-guide(?:\/|\.html)?$/.test(path) }
  function safePage(value) {
    if (!value || typeof value !== 'string') return null
    try {
      var url = new URL(value, location.origin)
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol) || isGuide(url.pathname)) return null
      return url.pathname + url.search
    } catch (_) { return null }
  }
  function entry() {
    var value = null
    try { value = safePage(sessionStorage.getItem(entryKey)) } catch (_) {}
    return value || safePage(document.referrer) || '/'
  }
  function setReturn() {
    var link = document.querySelector('[data-ins-guide-return]')
    if (link) link.setAttribute('href', entry())
  }
  function warmGuide() {
    if (prefetched) return prefetched
    prefetched = fetch(guidePath, { credentials: 'same-origin', cache: 'force-cache' }).then(function (response) { return response.ok ? response.arrayBuffer() : undefined }).catch(function () {})
    return prefetched
  }
  function reset() {
    leaving = false
    root.classList.remove('ins-guide-leaving', 'ins-guide-arriving')
  }
  function pause(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms) }) }
  function readyContent() {
    return new Promise(function (resolve) {
      var observer
      var timer = setTimeout(done, 3500)
      function done() { clearTimeout(timer); if (observer) observer.disconnect(); resolve() }
      function check() {
        if (isGuide(location.pathname) || (document.querySelector('#theme-insignificantia .ins-page-shell') && !document.querySelector('.ins-layout-loading-label'))) done()
      }
      observer = new MutationObserver(check)
      observer.observe(document.documentElement, { childList: true, subtree: true })
      check()
    })
  }
  async function arrive() {
    if (!root.classList.contains('ins-guide-arriving')) return
    try {
      await readyContent()
      var images = isGuide(location.pathname)
        ? [document.getElementById('hero-image')]
        : Array.from(document.querySelectorAll('.ins-carousel img')).slice(0, 1)
      await Promise.race([
        Promise.allSettled(images.filter(Boolean).map(function (image) { return image.decode ? image.decode() : Promise.resolve() }).concat(document.fonts ? [document.fonts.ready] : [])),
        pause(1800)
      ])
      var old = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      window.scrollTo(0, 0)
      root.style.scrollBehavior = old
      // Force the initial transparent frame before releasing it.
      void document.body.offsetWidth
      root.classList.remove('ins-guide-arriving')
      window.dispatchEvent(new Event('ins-guide-ready'))
    } finally {
      root.classList.remove('ins-guide-arriving')
      try { sessionStorage.removeItem(key) } catch (_) {}
    }
  }
  document.addEventListener('click', async function (event) {
    var link = event.target.closest && event.target.closest('a[data-ins-guide-enter],a[data-ins-guide-return],a[data-ins-guide-home]')
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || link.target === '_blank') return
    var target = new URL(link.href, location.href)
    if (target.origin !== location.origin) return
    event.preventDefault()
    if (leaving) return
    leaving = true
    var mode = link.hasAttribute('data-ins-guide-enter') ? 'guide' : link.hasAttribute('data-ins-guide-home') ? 'home' : 'return'
    if (mode === 'guide') {
      try { sessionStorage.setItem(entryKey, location.pathname + location.search) } catch (_) {}
      target = new URL(guidePath, location.origin)
    } else {
      target = new URL(mode === 'home' ? '/' : entry(), location.origin)
      target.hash = ''
    }
    root.classList.add('ins-guide-leaving')
    // Store only a same-origin path and a short-lived transition marker.
    try { sessionStorage.setItem(key, JSON.stringify({ path: target.pathname + target.search, mode: mode, time: Date.now() })) } catch (_) {}
    try {
      await Promise.all([pause(reduced.matches ? 0 : 320), mode === 'guide' ? Promise.race([warmGuide(), pause(900)]) : Promise.resolve()])
      location.assign(target.href)
      // Navigation can be cancelled by the browser; never leave a hidden document behind.
      setTimeout(reset, 4000)
    } catch (_) { reset(); location.assign(target.href) }
  })
  var lastY = scrollY
  function updateFooter(down) {
    var footer = document.querySelector('.ins-site-footer')
    if (!footer || !window.matchMedia('(hover: none), (pointer: coarse)').matches) return
    var box = footer.getBoundingClientRect()
    var visible = Math.min(innerHeight, box.bottom) - Math.max(0, box.top)
    var active = visible >= Math.min(box.height * 0.35, 36)
    if (!active || down === false) footer.classList.remove('ins-guide-footer-active')
    else if (down) footer.classList.add('ins-guide-footer-active')
  }
  window.addEventListener('scroll', function () { var down = scrollY > lastY; lastY = scrollY; updateFooter(down) }, { passive: true })
  var touchY = 0
  window.addEventListener('touchstart', function (e) { touchY = e.touches[0] ? e.touches[0].clientY : 0 }, { passive: true })
  window.addEventListener('touchmove', function (e) { if (e.touches[0]) { var y = e.touches[0].clientY; updateFooter(y < touchY); touchY = y } }, { passive: true })
  var observed = null
  var observer = new IntersectionObserver(function (entries) { if (entries.some(function (item) { return item.isIntersecting })) warmGuide() }, { rootMargin: '600px' })
  function bindFooter() {
    var footer = document.querySelector('.ins-site-footer')
    if (footer && footer !== observed) { if (observed) observer.unobserve(observed); observed = footer; observer.observe(footer) }
    setReturn()
  }
  var mutations = new MutationObserver(bindFooter)
  mutations.observe(document.documentElement, { childList: true, subtree: true })
  bindFooter()
  window.addEventListener('pageshow', function (event) { if (event.persisted) reset(); bindFooter() })
  window.addEventListener('pagehide', function () { root.classList.remove('ins-guide-leaving') })
  arrive()
})()
