export const AboutStyle = () => {
  return (
    <style jsx global>{`
      .ins-about-page {
        max-width: var(--ins-shell);
        margin: 0 auto;
        padding: 76px 34px 120px;
      }

      .ins-about-header {
        margin-bottom: 34px;
      }

      .ins-about-intro {
        margin-top: 24px;
        color: var(--ins-text-soft);
        font-family: var(--ins-ui-font);
        font-size: 17.5px;
        font-weight: 700;
        line-height: 2;
      }

      .ins-about-intro p {
        margin: 0 0 0.65em;
      }

      .ins-about-intro p:last-child {
        margin-bottom: 0;
      }

      .ins-social-strip {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 78px;
      }

      .ins-social-link {
        width: 64px;
        height: 64px;
        border: 1px solid rgba(225, 231, 226, 0.18);
        border-radius: 50%;
        background: var(--ins-surface);
        box-shadow:
          0 10px 28px rgba(5, 12, 16, 0.18);
        display: grid;
        place-items: center;
        color: var(--ins-text) !important;
        transition:
          transform 180ms ease,
          color 180ms ease,
          background-color 180ms ease,
          border-color 180ms ease;
      }

      .ins-social-link:hover,
      .ins-social-link:focus-visible {
        transform: translateY(-2px);
        color: var(--ins-surface) !important;
        background: var(--ins-text);
        border-color: var(--ins-text);
        text-decoration: none !important;
      }

      .ins-social-link:focus-visible {
        outline: 2px solid var(--ins-pink);
        outline-offset: 4px;
      }

      .ins-social-link svg {
        width: 27px;
        height: 27px;
        fill: currentColor;
      }

      .ins-portfolio-kicker {
        margin-bottom: 30px;
      }

      .ins-portfolio-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 36px 28px;
      }

      .ins-portfolio-item {
        min-width: 0;
      }

      .ins-portfolio-card {
        width: 100%;
        aspect-ratio: 9 / 16;
        padding: 0;
        overflow: hidden;
        position: relative;
        border: 1px solid var(--ins-line);
        border-radius: var(--ins-radius);
        box-shadow: var(--ins-shadow);
        color: var(--ins-text);
        cursor: pointer;
        transition:
          transform 180ms ease,
          border-color 180ms ease;
      }

      .ins-portfolio-card:hover {
        transform: translateY(-2px);
        border-color: rgba(237, 142, 172, 0.5);
      }

      .ins-portfolio-card img,
      .ins-lightbox-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ins-portfolio-number {
        position: absolute;
        left: 20px;
        bottom: 18px;
        color: rgba(242, 238, 228, 0.76);
        font-size: 12px;
        letter-spacing: 0.12em;
      }

      .ins-portfolio-item > p {
        min-height: 3.5em;
        margin: 13px 2px 0;
        color: var(--ins-muted);
        font-size: 13.5px;
        line-height: 1.75;
      }

      .ins-portfolio-placeholder-1 {
        background:
          radial-gradient(circle at 70% 20%, rgba(237,142,172,.28), transparent 28%),
          linear-gradient(155deg, #3b515d, #1d2c34 72%);
      }

      .ins-portfolio-placeholder-2 {
        background:
          linear-gradient(35deg, rgba(237,142,172,.18), transparent 36%),
          linear-gradient(145deg, #243640, #516671);
      }

      .ins-portfolio-placeholder-3 {
        background:
          radial-gradient(circle at 30% 65%, rgba(242,238,228,.12), transparent 30%),
          linear-gradient(160deg, #384c57, #1a2730);
      }

      .ins-portfolio-placeholder-4 {
        background:
          linear-gradient(125deg, #23333c 0 42%, #74495a 43% 45%, #334852 46%);
      }

      .ins-lightbox,
      .ins-lightbox * {
        box-sizing: border-box;
      }

      .ins-lightbox-close {
        font-family: inherit;
      }

      .ins-lightbox {
        position: fixed;
        inset: 0;
        z-index: 100;
        padding: 28px;
        background: rgba(8, 14, 18, 0.86);
        backdrop-filter: blur(7px);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ins-lightbox-dialog {
        max-width: min(520px, 92vw);
        max-height: 90vh;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      }

      .ins-lightbox-image {
        width: min(430px, 82vw, calc((100vh - 160px) * 9 / 16));
        width: min(430px, 82vw, calc((100dvh - 160px) * 9 / 16));
        aspect-ratio: 9 / 16;
        overflow: hidden;
        border-radius: var(--ins-radius);
        box-shadow:
          0 24px 80px rgba(0, 0, 0, 0.44);
        display: grid;
        place-items: center;
        color: rgba(242, 238, 228, 0.7);
        font-size: 20px;
        letter-spacing: 0.12em;
      }

      .ins-lightbox-dialog > p {
        max-width: 620px;
        margin: 0;
        color: #d7d9d3;
        font-size: 13px;
        line-height: 1.7;
        text-align: center;
      }

      .ins-lightbox-close {
        position: absolute;
        right: -48px;
        top: 0;
        width: 40px;
        height: 40px;
        border: 1px solid rgba(242, 238, 228, 0.25);
        border-radius: 50%;
        background: rgba(32, 45, 53, 0.85);
        color: var(--ins-text);
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
      }

      .ins-lightbox-close:hover {
        color: var(--ins-pink);
        border-color: rgba(237, 142, 172, 0.55);
      }

      @media (max-width: 1000px) {
        .ins-portfolio-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .ins-about-page {
          padding: 54px 18px 86px;
        }

        .ins-about-intro {
          font-size: 16.5px;
          line-height: 1.94;
        }

        .ins-about-header {
          margin-bottom: 28px;
        }

        .ins-social-strip {
          margin-bottom: 58px;
        }

        .ins-portfolio-grid {
          grid-template-columns: 1fr;
          gap: 34px;
        }

        .ins-lightbox-close {
          right: 0;
          top: -50px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ins-social-link,
        .ins-portfolio-card {
          transition: none !important;
        }
      }
    `}</style>
  )
}

