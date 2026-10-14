export const Style = () => {
  return (
    <style jsx global>{`
      :root {
        --ins-bg: #202d35;
        --ins-bg-deep: #1b272e;
        --ins-surface: #2b3942;
        --ins-surface-hover: #31424c;
        --ins-surface-soft: #26353e;
        --ins-text: #f2eee4;
        --ins-text-soft: #d6d3ca;
        --ins-muted: #aeb9b9;
        --ins-muted-2: #849298;
        --ins-line: rgba(225, 231, 226, 0.1);
        --ins-line-strong: rgba(225, 231, 226, 0.18);
        --ins-pink: #ed8eac;
        --ins-pink-hover: #f4a7bf;
        --ins-shadow: 0 16px 38px rgba(5, 12, 16, 0.25),
          0 3px 10px rgba(5, 12, 16, 0.18);
        --ins-shadow-soft: 0 10px 28px rgba(5, 12, 16, 0.18);
        --ins-radius: 9px;
        --ins-shell: 1400px;
        --ins-content: 900px;
        --ins-accent: var(--ins-pink);
        --ins-accent-hover: var(--ins-pink-hover);
        --ins-faint: var(--ins-muted-2);
        --ins-max: var(--ins-shell);
        --ins-ui-font: "Avenir Next", "Segoe UI Variable Display", "SF Pro Display",
          "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
        --ins-serif: Georgia, "Songti SC", "STSong", serif;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        background: var(--ins-bg);
        color: var(--ins-text);
        font-family: var(--ins-ui-font);
        font-weight: 450;
        line-height: 1.85;
        -webkit-font-smoothing: antialiased;
      }

      #theme-insignificantia,
      #theme-insignificantia * {
        box-sizing: border-box;
      }

      #theme-insignificantia {
        min-height: 100vh;
        background: var(--ins-bg);
        color: var(--ins-text);
      }

      #theme-insignificantia a {
        color: var(--ins-pink);
        text-decoration: none;
      }

      #theme-insignificantia a:hover {
        color: var(--ins-pink-hover);
        text-decoration: underline;
        text-underline-offset: 4px;
      }

      #theme-insignificantia button {
        font: inherit;
      }

      .ins-page-shell {
        min-height: 60vh;
        background: var(--ins-bg);
      }

      /* Header — matches uploaded visual baseline */
      .ins-site-header {
        height: 78px;
        background: var(--ins-bg);
        border-bottom: 1px solid rgba(225, 231, 226, 0.055);
        position: relative;
        z-index: 50;
      }

      .ins-nav-inner {
        max-width: var(--ins-shell);
        height: 100%;
        margin: auto;
        padding: 0 34px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
      }

      .ins-brand {
        color: var(--ins-text) !important;
        font-family: var(--ins-ui-font);
        font-size: 25px;
        font-weight: 760;
        letter-spacing: -0.04em;
        white-space: nowrap;
      }

      .ins-brand:hover {
        color: var(--ins-pink) !important;
        text-decoration: none !important;
      }

      .ins-nav-links {
        display: flex;
        align-items: center;
        gap: 35px;
      }

      .ins-nav-links a {
        color: #c9d0ce !important;
        font-family: var(--ins-ui-font);
        font-size: 13px;
        font-weight: 420;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .ins-nav-links a:hover {
        color: var(--ins-pink) !important;
        text-decoration: none !important;
      }

      .ins-menu-toggle {
        display: none;
        width: 44px;
        height: 44px;
        border: 1px solid var(--ins-line-strong);
        border-radius: var(--ins-radius);
        background: transparent;
        color: var(--ins-text);
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
      }

      .ins-menu-toggle span,
      .ins-menu-toggle span::before,
      .ins-menu-toggle span::after {
        content: "";
        display: block;
        width: 19px;
        height: 1.5px;
        background: currentColor;
        position: relative;
        transition: 0.18s ease;
      }

      .ins-menu-toggle span::before {
        position: absolute;
        top: -6px;
      }

      .ins-menu-toggle span::after {
        position: absolute;
        top: 6px;
      }

      .ins-menu-toggle[aria-expanded="true"] span {
        background: transparent;
      }

      .ins-menu-toggle[aria-expanded="true"] span::before {
        top: 0;
        transform: rotate(45deg);
      }

      .ins-menu-toggle[aria-expanded="true"] span::after {
        top: 0;
        transform: rotate(-45deg);
      }

      .ins-site-header .ins-mobile-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: auto;
        right: 20px;
        bottom: auto;
        width: min(240px, calc(100% - 40px));
        height: auto;
        min-height: 0;
        max-height: calc(100vh - 100px);
        max-height: calc(100dvh - 100px);
        overflow-y: auto;
        background: var(--ins-bg);
        border: 1px solid var(--ins-line);
        border-radius: var(--ins-radius);
        padding: 10px 20px;
        box-shadow: var(--ins-shadow-soft);
      }

      @media (max-width: 760px) {
        .ins-site-header .ins-mobile-menu[data-open="true"] {
          display: block;
        }
      }

      .ins-mobile-menu a {
        display: block;
        padding: 13px 2px;
        color: #d4d9d6 !important;
        font-size: 13px;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        border-bottom: 1px solid rgba(225, 231, 226, 0.06);
      }

      .ins-mobile-menu a:last-child {
        border-bottom: 0;
      }

      .ins-mobile-menu a:hover {
        color: var(--ins-pink) !important;
        text-decoration: none !important;
      }

      /* Shared button */
      .ins-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        border: 1px solid rgba(237, 142, 172, 0.72);
        border-radius: var(--ins-radius);
        padding: 9px 18px;
        color: var(--ins-pink) !important;
        font-size: 14px;
        font-weight: 620;
        background: transparent;
        transition: 0.18s ease;
        cursor: pointer;
      }

      .ins-btn.primary {
        background: var(--ins-pink);
        color: #253039 !important;
        border-color: var(--ins-pink);
      }

      .ins-btn:hover {
        text-decoration: none !important;
        transform: translateY(-1px);
      }

      /* Home Hero — exact baseline from uploaded index */
      .ins-hero {
        min-height: 650px;
        position: relative;
        overflow: hidden;
        background: radial-gradient(
            circle at 82% 33%,
            rgba(101, 130, 143, 0.13),
            transparent 26%
          ),
          linear-gradient(145deg, #202d35 0%, #202d35 58%, #1d2a32 100%);
        border-bottom: 1px solid rgba(225, 231, 226, 0.04);
      }

      .ins-hero-inner {
        max-width: var(--ins-shell);
        min-height: 650px;
        margin: auto;
        padding: 82px 34px 86px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 620px;
        gap: 29px;
        align-items: center;
      }

      .ins-hero-kicker {
        color: var(--ins-pink);
        font-size: 12px;
        font-weight: 650;
        letter-spacing: 0.16em;
        margin-bottom: 22px;
      }

      .ins-hero-title {
        margin: 0;
        max-width: 720px;
        font-family: var(--ins-ui-font);
        font-size: clamp(46px, 5.45vw, 78px);
        line-height: 1.08;
        font-weight: 760;
        letter-spacing: -0.055em;
      }

      .ins-hero-copy {
        max-width: 650px;
        margin: 28px 0 0;
        color: #c8cfcd;
        font-size: 17px;
        line-height: 2;
        letter-spacing: 0.008em;
      }

      .ins-hero-actions {
        margin-top: 32px;
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }

      .ins-hero-visual {
        min-width: 0;
        position: relative;
        padding: 18px 0 58px;
      }

      .ins-carousel {
        position: relative;
        overflow: hidden;
        border-radius: var(--ins-radius);
        aspect-ratio: 1.17 / 1;
        background: #22323b;
        border: 1px solid var(--ins-line);
        box-shadow: var(--ins-shadow);
      }

      .ins-carousel-track {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .ins-slide {
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 0.35s ease;
        overflow: hidden;
        background: #23333c;
        background-size: cover;
        background-position: center;
      }

      .ins-slide.active {
        opacity: 1;
        z-index: 1;
      }

      .ins-slide-one {
        background:
          radial-gradient(circle at 73% 28%, rgba(237, 142, 172, 0.22), transparent 24%),
          linear-gradient(140deg, #314955 0%, #293a43 46%, #17242b 100%);
      }

      .ins-slide-two {
        background:
          linear-gradient(35deg, rgba(237, 142, 172, 0.14), transparent 36%),
          radial-gradient(circle at 28% 63%, #5b6e78 0%, #2b3a43 38%, #1b282f 75%);
      }

      .ins-slide-three {
        background:
          linear-gradient(115deg, #24323a 0 25%, #61727a 26% 28%, #2d3f49 29% 58%, #814e61 59% 61%, #1c2930 62%);
      }

      .ins-slide-label {
        position: absolute;
        left: 26px;
        bottom: 24px;
        z-index: 2;
        color: rgba(242, 238, 228, 0.72);
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        background: rgba(16, 27, 33, 0.34);
        padding: 6px 9px;
        border-radius: 6px;
        backdrop-filter: blur(6px);
      }

      .ins-carousel-dots {
        position: absolute;
        z-index: 4;
        right: 16px;
        bottom: 14px;
        display: flex;
        gap: 7px;
        padding: 7px 10px;
        border-radius: 999px;
        background: rgba(16, 27, 33, 0.46);
        backdrop-filter: blur(7px);
      }

      .ins-carousel-dot {
        width: 7px;
        height: 7px;
        border: 0;
        border-radius: 50%;
        padding: 0;
        background: rgba(242, 238, 228, 0.32);
        cursor: pointer;
      }

      .ins-carousel-dot.active {
        background: var(--ins-pink);
      }

      .ins-carousel-arrow {
        position: absolute;
        top: 50%;
        z-index: 4;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1px solid rgba(242, 238, 228, 0.2);
        background: rgba(16, 27, 33, 0.52);
        color: var(--ins-text);
        cursor: pointer;
        display: grid;
        place-items: center;
        transform: translateY(-50%);
      }

      .ins-carousel-arrow:hover {
        border-color: rgba(237, 142, 172, 0.65);
        color: var(--ins-pink);
      }

      .ins-carousel-arrow.prev {
        left: 14px;
      }

      .ins-carousel-arrow.next {
        right: 14px;
      }

      .ins-hero-symbols {
        position: absolute;
        right: 4px;
        bottom: 9px;
        display: flex;
        gap: 17px;
        align-items: center;
        color: #76909b;
        opacity: 0.42;
        font-family: Arial, sans-serif;
        font-size: 31px;
        line-height: 1;
        user-select: none;
      }

      .ins-hero-symbols span:nth-child(2) {
        font-size: 27px;
      }

      .ins-hero-symbols span:nth-child(3) {
        font-size: 29px;
      }

      /* Home cards */
      .ins-home-content {
        max-width: var(--ins-shell);
        margin: auto;
        padding: 88px 34px 120px;
      }

      .ins-post-list {
        width: min(var(--ins-content), 100%);
        margin: 0 auto;
        display: grid;
        gap: 44px;
      }

      .ins-post-card {
        display: block;
        color: inherit !important;
        text-decoration: none !important;
        background: var(--ins-surface);
        border: 1px solid var(--ins-line);
        border-radius: var(--ins-radius);
        box-shadow: var(--ins-shadow);
        padding: 50px 54px 38px;
        transition: background 0.18s ease, transform 0.18s ease,
          box-shadow 0.18s ease;
      }

      .ins-post-card:hover {
        background: var(--ins-surface-hover);
        transform: translateY(-2px);
        box-shadow: 0 20px 44px rgba(5, 12, 16, 0.29),
          0 4px 12px rgba(5, 12, 16, 0.18);
        text-decoration: none !important;
      }

      .ins-post-meta {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
        margin-bottom: 17px;
        color: var(--ins-muted-2);
        font-size: 12px;
      }

      .ins-primary-tag {
        color: var(--ins-pink);
        font-weight: 650;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .ins-post-card h2 {
        margin: 0 0 18px;
        font-family: var(--ins-serif);
        font-size: 32px;
        line-height: 1.34;
        font-weight: 700;
        letter-spacing: -0.012em;
        color: var(--ins-text);
      }

      .ins-post-card:hover h2 {
        color: var(--ins-pink);
      }

      .ins-post-card p {
        margin: 0;
        max-width: 1000px;
        color: #c8cfcd;
        font-size: 15.5px;
        line-height: 2;
        font-weight: 500;
        letter-spacing: 0.01em;
      }

      .ins-post-card-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 25px;
      }

      .ins-continue-reading {
        color: var(--ins-pink);
        font-size: 13px;
        line-height: 1.5;
        font-weight: 620;
        letter-spacing: 0.01em;
      }

      .ins-post-card:hover .ins-continue-reading {
        color: var(--ins-pink-hover);
      }

      .ins-home-end-actions {
        width: min(var(--ins-content), 100%);
        margin: 58px auto 0;
        display: flex;
        justify-content: center;
        gap: 14px;
        flex-wrap: wrap;
      }

      /* Footer */
      .ins-site-footer {
        background: var(--ins-bg-deep);
        border-top: 1px solid rgba(225, 231, 226, 0.06);
        padding: 38px 34px;
        color: var(--ins-muted-2);
        font-size: 12px;
      }

      .ins-footer-inner {
        max-width: var(--ins-shell);
        margin: auto;
        display: flex;
        justify-content: space-between;
        gap: 24px;
      }

      @media (max-width: 1180px) {
        .ins-hero-inner {
          grid-template-columns: minmax(0, 1fr) 560px;
          gap: 29px;
        }
      }

      @media (max-width: 1000px) {
        .ins-hero-inner {
          grid-template-columns: 1fr;
          gap: 26px;
          padding-top: 68px;
          min-height: auto;
        }

        .ins-hero {
          min-height: auto;
        }

        .ins-hero-visual {
          max-width: 820px;
          padding-left: 0;
        }
      }

      @media (max-width: 760px) {
        .ins-site-header {
          height: 70px;
        }

        .ins-nav-inner {
          padding: 0 20px;
        }

        .ins-brand {
          font-size: 21px;
        }

        .ins-nav-links {
          display: none;
        }

        .ins-menu-toggle {
          display: flex;
        }

        .ins-hero-inner {
          padding: 56px 20px 66px;
        }

        .ins-hero-title {
          font-size: 44px;
        }

        .ins-hero-copy {
          font-size: 16px;
        }

        .ins-hero-visual {
          padding: 26px 0 48px;
        }

        .ins-hero-symbols {
          right: 4px;
          bottom: 2px;
          font-size: 28px;
        }

        .ins-home-content {
          padding: 60px 18px 84px;
        }

        .ins-post-list {
          gap: 36px;
        }

        .ins-post-card {
          padding: 36px 28px 32px;
        }

        .ins-post-card h2 {
          font-size: 27px;
        }

        .ins-post-card p {
          font-size: 15px;
        }

        .ins-site-footer {
          padding: 31px 20px;
        }

        .ins-footer-inner {
          display: block;
        }

        .ins-footer-inner span {
          display: block;
          margin-top: 6px;
        }
      }

      @media (max-width: 520px) {
        .ins-hero-title {
          font-size: 39px;
        }

        .ins-hero-actions {
          gap: 10px;
        }

        .ins-btn {
          padding: 8px 14px;
        }

        .ins-post-meta {
          gap: 10px;
        }
      }


      .ins-system-page {
        width: min(900px, calc(100% - 68px));
        min-height: 60vh;
        margin: 0 auto;
        padding: 96px 0 120px;
      }

      .ins-system-page h1 {
        margin: 18px 0 0;
        color: var(--ins-text);
        font-family: Georgia, "Songti SC", "STSong", serif;
        font-size: 42px;
        line-height: 1.25;
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          scroll-behavior: auto !important;
        }

        .ins-slide,
        .ins-post-card,
        .ins-btn {
          transition: none !important;
        }
      }
    `}</style>
  )
}
