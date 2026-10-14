export const MotionStyle = () => {
  return (
    <style jsx global>{`
      /*
       * Page entrance: header/nav is intentionally outside this wrapper.
       * The motion is deliberately more visible than the previous 7px/260ms
       * transition so it reads as a conventional modern fade-up entrance.
       */
      .ins-page-enter {
        animation: ins-page-rise-in 680ms cubic-bezier(0.22, 1, 0.36, 1) 45ms both;
        will-change: opacity, transform;
      }

      @keyframes ins-page-rise-in {
        from {
          opacity: 0;
          transform: translate3d(0, 28px, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }

      /*
       * Hero carousel: every incoming work moves from right to centre while
       * fading in; the outgoing work moves left while fading out. The 7-second
       * rotation interval remains controlled by Hero.js.
       */
      .ins-slide {
        opacity: 0;
        transform: translate3d(14%, 0, 0);
        transition:
          opacity 720ms ease,
          transform 720ms cubic-bezier(0.22, 1, 0.36, 1);
        will-change: opacity, transform;
      }

      .ins-slide.active {
        opacity: 1;
        transform: translate3d(0, 0, 0);
        z-index: 2;
      }

      .ins-slide.is-leaving {
        opacity: 0;
        transform: translate3d(-14%, 0, 0);
        z-index: 1;
      }

      @media (prefers-reduced-motion: reduce) {
        .ins-page-enter {
          opacity: 1 !important;
          transform: none !important;
          animation: none !important;
        }

        .ins-slide,
        .ins-slide.active,
        .ins-slide.is-leaving {
          transform: none !important;
          transition: none !important;
        }
      }
    `}</style>
  )
}
