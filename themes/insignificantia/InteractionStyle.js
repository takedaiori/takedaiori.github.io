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
      .ins-carousel .ins-slide.active, .ins-carousel .ins-slide.is-leaving { animation: none !important; }
      .ins-image-loading::after { animation: none; border-style: dotted; }
    }
  `}</style>
)
