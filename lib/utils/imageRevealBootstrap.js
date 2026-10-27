// Runs before the body is painted; the controller has a bounded recovery path.
export const imageRevealBootstrap = `
(function () {
  var root = document.documentElement
  root.classList.add('ins-image-js')
  var external = true
  var first = true
  try { external = !document.referrer || new URL(document.referrer).origin !== location.origin } catch (_) {}
  try { first = sessionStorage.getItem('insignificantia.images.visited.v1') !== '1' } catch (_) {}
  window.__insInitialImagesPending = first || external
  if (window.__insInitialImagesPending) {
    root.classList.add('ins-initial-loading')
    window.__insImageRecovery = setTimeout(function () {
      root.classList.remove('ins-initial-loading', 'ins-image-js')
      window.__insInitialImagesPending = false
    }, 18000)
  }
})()
`

export const imageRevealStyle = `
html.ins-initial-loading { background: #202d35; }
html.ins-initial-loading body { opacity: 0 !important; pointer-events: none; }
html.ins-initial-loading::after {
  content: 'LOADING…'; position: fixed; inset: 0; display: grid;
  place-items: center; color: #ed8eac; font-size: 14px; font-weight: 650;
  letter-spacing: .16em; pointer-events: none;
  font-family: "Avenir Next", "Segoe UI Variable Display", "SF Pro Display",
    "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
}
html.ins-initial-loading .ins-page-enter,
html.ins-initial-loading body > .top,
html.ins-initial-loading body > main { animation-play-state: paused; }
html.ins-image-js body { transition: opacity 500ms ease; }
html.ins-guide-leaving body { transition: opacity 320ms ease; }
html.ins-image-js #theme-insignificantia img,
html.ins-image-js .ins-lightbox img,
html.ins-image-js main.wrap img {
  opacity: 0 !important;
  transition: opacity 420ms ease, transform 300ms ease !important;
}
html.ins-image-js #theme-insignificantia img[data-ins-image-state="ready"],
html.ins-image-js .ins-lightbox img[data-ins-image-state="ready"],
html.ins-image-js main.wrap img[data-ins-image-state="ready"] { opacity: 1 !important; }
html.ins-image-js .lazy-image-wrapper:has(.lazy-image-real) .lazy-image-preview { opacity: 0 !important; }
html.ins-image-js .ins-notion-content .notion-asset-wrapper:has(img) figcaption,
html.ins-image-js .ins-notion-content .notion-asset-wrapper:has(img) .notion-asset-caption {
  opacity: 0; visibility: hidden;
  transition: opacity 300ms ease, visibility 0s;
}
html.ins-image-js .ins-notion-content .notion-asset-wrapper[data-ins-image-group="ready"] figcaption,
html.ins-image-js .ins-notion-content .notion-asset-wrapper[data-ins-image-group="ready"] .notion-asset-caption {
  opacity: 1; visibility: visible; transition-delay: 100ms, 0s;
}
@media (prefers-reduced-motion: reduce) {
  html.ins-image-js body,
  html.ins-image-js #theme-insignificantia img,
  html.ins-image-js .ins-lightbox img,
  html.ins-image-js main.wrap img,
  html.ins-image-js .ins-notion-content figcaption,
  html.ins-image-js .ins-notion-content .notion-asset-caption { transition: none !important; }
}
`
