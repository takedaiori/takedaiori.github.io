export const InteractionStyle = () => (
  <style jsx global>{`
    #theme-insignificantia .ins-site-header {
      position: sticky;
      top: 0;
      z-index: 80;
      transform: translateY(0);
      transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease;
    }
    #theme-insignificantia .ins-site-header[data-hidden="true"] {
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }
    .ins-carousel { touch-action: pan-y pinch-zoom; }
    .ins-carousel img { user-select: none; -webkit-user-drag: none; }
    .ins-carousel { cursor: grab; }
    .ins-carousel[data-dragging="true"] { cursor: grabbing; }
    .ins-carousel .ins-carousel-arrow {
      width: 44px;
      height: 48px;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      color: var(--ins-text);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-50%) scale(.92);
      transition: opacity 180ms ease, transform 180ms ease, color 180ms ease;
      filter: drop-shadow(0 1px 3px rgba(5,12,16,.65));
    }
    .ins-carousel .ins-carousel-arrow svg {
      width: 18px;
      height: 18px;
      stroke-width: 2.5;
      transition: stroke-width 180ms ease;
    }
    .ins-carousel:hover .ins-carousel-arrow,
    .ins-carousel:has(:focus-visible) .ins-carousel-arrow {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(-50%) scale(1);
    }
    .ins-carousel .ins-carousel-arrow:hover,
    .ins-carousel .ins-carousel-arrow:focus-visible { color: var(--ins-pink); }
    .ins-carousel .ins-carousel-arrow:hover svg,
    .ins-carousel .ins-carousel-arrow:focus-visible svg { stroke-width: 3.5; }
    .ins-carousel .ins-carousel-arrow:focus-visible { outline: 2px solid var(--ins-pink); outline-offset: 2px; }
    @media (hover: none) {
      .ins-carousel .ins-carousel-arrow {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(-50%) scale(1);
      }
    }
    /* Keep native scrolling, with a track/thumb matching the article palette. */
    .ins-reading-toc-panel {
      color-scheme: dark;
      scrollbar-width: thin;
      scrollbar-color: var(--ins-muted-2) var(--ins-surface-soft);
    }
    .ins-reading-toc-panel::-webkit-scrollbar { width: 7px; }
    .ins-reading-toc-panel::-webkit-scrollbar-track { background: var(--ins-surface-soft); border-radius: 999px; }
    .ins-reading-toc-panel::-webkit-scrollbar-thumb {
      background: var(--ins-muted-2);
      border: 2px solid var(--ins-surface-soft);
      border-radius: 999px;
    }
    .ins-reading-toc-panel:hover { scrollbar-color: var(--ins-pink) var(--ins-surface-soft); }
    .ins-reading-toc-panel::-webkit-scrollbar-thumb:hover { background: var(--ins-pink); }
    .ins-reading-toc-panel::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
    .ins-reading-toc-panel::-webkit-scrollbar-corner { background: var(--ins-bg); }
    /* Keyframes make direction changes atomic, including the wrap from 1 to 3. */
    .ins-carousel[data-direction="next"] .ins-slide.active { animation: ins-slide-from-right 720ms cubic-bezier(0.22, 1, 0.36, 1) both; }
    .ins-carousel[data-direction="next"] .ins-slide.is-leaving { animation: ins-slide-to-left 720ms ease both; }
    .ins-carousel[data-direction="prev"] .ins-slide.active { animation: ins-slide-from-left 720ms cubic-bezier(0.22, 1, 0.36, 1) both; }
    .ins-carousel[data-direction="prev"] .ins-slide.is-leaving { animation: ins-slide-to-right 720ms ease both; }
    @keyframes ins-slide-from-right { from { opacity:0; transform:translateX(14%); } to { opacity:1; transform:translateX(0); } }
    @keyframes ins-slide-to-left { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(-14%); } }
    @keyframes ins-slide-from-left { from { opacity:0; transform:translateX(-14%); } to { opacity:1; transform:translateX(0); } }
    @keyframes ins-slide-to-right { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(14%); } }
    .ins-reading-context { margin-top: 28px; margin-bottom: 12px; color: var(--ins-pink); }
    .ins-post-nav > :first-child { text-align: left; }
    .ins-post-nav > :nth-child(2) { text-align: right; }
    .ins-image-loading { min-height: 100px; }
    .ins-image-loading::after {
      content: "";
      position: absolute;
      top: 50%; left: 50%;
      width: 26px; height: 26px;
      margin: -13px 0 0 -13px;
      border: 2px solid rgba(237,142,172,.24);
      border-top-color: var(--ins-pink, #ed8eac);
      border-radius: 50%;
      animation: ins-image-spin 850ms linear infinite;
      pointer-events: none;
      z-index: 3;
    }
    @keyframes ins-image-spin { to { transform: rotate(360deg); } }
    @media (max-width: 760px) { .ins-post-nav > :nth-child(2) { text-align: left; } }
    @media (prefers-reduced-motion: reduce) {
      #theme-insignificantia .ins-site-header { transition: none; }
      .ins-carousel .ins-carousel-arrow,
      .ins-carousel .ins-carousel-arrow svg { transition: none; }
      .ins-carousel .ins-slide.active, .ins-carousel .ins-slide.is-leaving { animation: none !important; }
      .ins-image-loading::after { animation: none; border-style: dotted; }
    }
  `}</style>
)
