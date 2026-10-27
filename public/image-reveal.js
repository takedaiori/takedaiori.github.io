/* Decode full images before revealing them; keep image captions in the same state. */
;(function () {
  'use strict'
  if (window.InsignificantiaImages) return
  var root = document.documentElement
  root.classList.add('ins-image-js')
  var initial = Boolean(window.__insInitialImagesPending)
  var images = new Map()
  var hosts = new Map()
  var quietTimer
  var releaseTimer
  var released = false
  var resolveInitial
  var selector = '#theme-insignificantia img, .ins-lightbox img, main.wrap img'
  var initialReady = new Promise(function (resolve) { resolveInitial = resolve })
  function imageKey(image) {
    return [image.getAttribute('src'), image.getAttribute('srcset'), image.getAttribute('sizes'), image.currentSrc, image.classList.contains('lazy-image-placeholder')].join('|')
  }
  function isPreview(image) {
    return image.classList.contains('lazy-image-preview') && image.parentElement && image.parentElement.querySelector('.lazy-image-real')
  }
  function refreshHost(host) {
    var states = Array.from(images).filter(function (item) { return item[0].isConnected && item[1].host === host }).map(function (item) { return item[1] })
    if (!states.length) { host.classList.remove('ins-image-loading'); host.removeAttribute('aria-busy'); host.removeAttribute('data-ins-image-group'); return }
    var pending = states.some(function (state) { return state.status === 'pending' })
    var ready = states.every(function (state) { return state.status === 'ready' })
    host.setAttribute('data-ins-image-group', ready ? 'ready' : pending ? 'pending' : 'error')
    host.setAttribute('aria-busy', String(pending))
    var spinner = host.matches('.notion-asset-wrapper') || Boolean(host.closest('.ins-carousel, .ins-portfolio-grid, .ins-lightbox'))
    host.classList.toggle('ins-image-loading', pending && spinner)
  }
  function release(reason) {
    if (released) return
    released = true
    clearTimeout(quietTimer)
    clearTimeout(releaseTimer)
    clearTimeout(window.__insImageRecovery)
    window.__insInitialImagesPending = false
    initial = false
    root.dataset.insImageRelease = reason
    try { sessionStorage.setItem('insignificantia.images.visited.v1', '1') } catch (_) {}
    // Commit the transparent state before beginning the whole-document fade.
    void document.body.offsetWidth
    root.classList.remove('ins-initial-loading')
    resolveInitial()
    window.dispatchEvent(new Event('ins-images-ready'))
  }
  function contentReady() {
    if (document.querySelector('main.wrap')) return true
    return Boolean(document.querySelector('#theme-insignificantia .ins-page-shell main')) && !document.querySelector('.ins-layout-loading-label')
  }
  function checkInitial() {
    if (!initial || released) return
    clearTimeout(quietTimer)
    if (!contentReady()) return
    var pending = Array.from(images).some(function (item) { return item[0].isConnected && item[1].status === 'pending' })
    if (pending) return
    // Theme chunks may insert their images just after the shell mounts.
    quietTimer = setTimeout(function () {
      if (!contentReady()) return
      if (Array.from(images).some(function (item) { return item[0].isConnected && item[1].status === 'pending' })) return
      release('complete')
    }, 200)
  }
  function settle(image, state, status, token) {
    if (!images.has(image) || state.token !== token || !image.isConnected) return
    state.decoding = false
    state.status = status
    image.setAttribute('data-ins-image-state', status)
    refreshHost(state.host)
    checkInitial()
  }
  function update(image) {
    var state = images.get(image)
    if (!state || !image.isConnected) return
    var key = imageKey(image)
    if (key !== state.key) {
      state.key = key
      state.token++
      state.decoding = false
      state.status = 'pending'
      image.setAttribute('data-ins-image-state', 'pending')
    }
    if (initial && image.loading !== 'eager') image.loading = 'eager'
    if (image.classList.contains('lazy-image-placeholder') || !image.complete) {
      state.status = 'pending'
      image.setAttribute('data-ins-image-state', 'pending')
      refreshHost(state.host)
      checkInitial()
      return
    }
    if (state.decoding || state.status === 'ready' || state.status === 'error') return
    var token = state.token
    if (!image.naturalWidth) { settle(image, state, 'error', token); return }
    state.decoding = true
    refreshHost(state.host)
    Promise.resolve().then(function () { return image.decode ? image.decode() : undefined }).then(function () {
      if (imageKey(image) !== state.key) { update(image); return }
      settle(image, state, image.naturalWidth ? 'ready' : 'error', token)
    }, function () {
      if (imageKey(image) !== state.key) { update(image); return }
      // Some engines reject decode for an otherwise fully loaded SVG/GIF.
      settle(image, state, image.complete && image.naturalWidth ? 'ready' : 'error', token)
    })
  }
  function watch(image) {
    if (isPreview(image)) return
    if (images.has(image)) { update(image); return }
    var host = image.closest('.notion-asset-wrapper') || image.parentElement
    if (!host) return
    if (!hosts.has(host)) {
      var position = host.style.position
      var spinnerHost = host.matches('.notion-asset-wrapper') || host.closest('.ins-carousel, .ins-portfolio-grid, .ins-lightbox')
      var positioned = spinnerHost && getComputedStyle(host).position === 'static'
      if (positioned) host.style.position = 'relative'
      hosts.set(host, { position: position, positioned: positioned })
    }
    var state = { host: host, status: 'pending', token: 0, key: null, decoding: false }
    state.onLoad = function () { update(image) }
    state.onError = function () {
      if (image.complete && !image.naturalWidth && !image.classList.contains('lazy-image-placeholder')) settle(image, state, 'error', state.token)
      else update(image)
    }
    images.set(image, state)
    image.addEventListener('load', state.onLoad)
    image.addEventListener('error', state.onError)
    update(image)
  }
  function scan() {
    document.querySelectorAll(selector).forEach(watch)
    images.forEach(function (state, image) {
      if (!image.isConnected) {
        image.removeEventListener('load', state.onLoad)
        image.removeEventListener('error', state.onError)
        images.delete(image)
        refreshHost(state.host)
      }
    })
    hosts.forEach(function (state, host) {
      if (!host.isConnected) {
        if (state.positioned) host.style.position = state.position
        hosts.delete(host)
      }
    })
    checkInitial()
  }
  var scheduled = false
  function scheduleScan() {
    if (scheduled) return
    scheduled = true
    queueMicrotask(function () { scheduled = false; scan() })
  }
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === 'childList') scheduleScan()
      else if (record.target.tagName === 'IMG') watch(record.target)
    })
  })
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset', 'sizes', 'class', 'data-src'] })
  document.addEventListener('ins-images-scan', scheduleScan)
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) { root.classList.remove('ins-initial-loading'); scan() }
  })
  window.InsignificantiaImages = { initialReady: initialReady, scan: scan }
  if (initial) releaseTimer = setTimeout(function () { release('timeout') }, 12000)
  else { released = true; resolveInitial() }
  scan()
})()
