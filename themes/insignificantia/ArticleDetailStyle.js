export const ArticleDetailStyle = () => {
  return (
    <style jsx global>{`
      .ins-article-shell {
        background: var(--ins-bg);
      }

      .ins-article-header {
        width: min(810px, calc(100% - 68px));
        margin: 0 auto;
        padding: 88px 0 42px;
      }

      .ins-article-date {
        margin-bottom: 22px;
        color: var(--ins-muted-2);
        font-size: 13px;
        line-height: 1.5;
        letter-spacing: 0.06em;
      }

      .ins-article-title {
        margin: 0;
        color: var(--ins-text);
        font-family: Georgia, "Songti SC", "STSong", serif;
        font-size: clamp(43px, 5.2vw, 64px);
        line-height: 1.22;
        letter-spacing: -0.028em;
        font-weight: 700;
      }

      .ins-article-layout {
        width: min(810px, calc(100% - 68px));
        margin: 0 auto;
        padding: 8px 0 110px;
        position: relative;
      }

      .ins-article-body {
        width: 100%;
        color: #d2d5cf;
        font-size: 17.5px;
        line-height: 2;
        letter-spacing: 0.018em;
        font-weight: 450;
      }

      .ins-article-lead {
        margin: 0 0 2em;
        color: #deddd5;
        font-size: 19px;
        line-height: 1.95;
        font-weight: 500;
      }

      .ins-notion-content .notion-title,
      .ins-notion-content .notion-page-icon-wrapper {
        display: none !important;
      }

      .ins-notion-content .notion-page {
        width: 100% !important;
        padding: 0 !important;
        background: transparent !important;
      }

      .ins-notion-content .notion-page-content {
        width: 100% !important;
        max-width: none !important;
        padding: 0 !important;
      }

      .ins-notion-content p,
      .ins-notion-content .notion-text {
        color: #d2d5cf;
        font-size: 17.5px;
        line-height: 2;
      }

      .ins-notion-content h1,
      .ins-notion-content .notion-h1 {
        margin: 2.2em 0 0.82em;
        color: var(--ins-text);
        font-family: Georgia, "Songti SC", "STSong", serif;
        font-size: 38px;
        line-height: 1.34;
        letter-spacing: -0.016em;
      }

      .ins-notion-content h2,
      .ins-notion-content .notion-h2 {
        margin: 2.25em 0 0.82em;
        color: var(--ins-text);
        font-family: Georgia, "Songti SC", "STSong", serif;
        font-size: 32px;
        line-height: 1.38;
        letter-spacing: -0.014em;
      }

      .ins-notion-content h3,
      .ins-notion-content .notion-h3 {
        margin: 1.95em 0 0.72em;
        color: var(--ins-text);
        font-family: Georgia, "Songti SC", "STSong", serif;
        font-size: 23px;
        line-height: 1.45;
      }

      .ins-notion-content strong {
        color: var(--ins-text);
        font-weight: 650;
      }

      .ins-notion-content a {
        color: var(--ins-pink) !important;
        font-weight: 570;
      }

      /* Quote: no blue box, just a cream vertical rule and quieter text. */
      .ins-notion-content blockquote,
      .ins-notion-content .notion-quote {
        margin: 2.2em 0 !important;
        padding: 2px 0 2px 22px !important;
        border: 0 !important;
        border-left: 2px solid var(--ins-text) !important;
        border-radius: 0 !important;
        background: transparent !important;
        color: #b8c1bd !important;
        font-size: 17px;
        line-height: 1.92;
        font-style: normal;
      }

      .ins-notion-content blockquote *,
      .ins-notion-content .notion-quote * {
        color: inherit !important;
      }

      /* Callout: close to the site's main background instead of bright blue. */
      .ins-notion-content .notion-callout {
        margin: 2.1em 0 !important;
        padding: 18px 20px !important;
        border: 1px solid var(--ins-line) !important;
        border-radius: var(--ins-radius) !important;
        background: #26343c !important;
        color: #d1d5cf !important;
        box-shadow: none !important;
      }

      .ins-notion-content .notion-callout * {
        color: inherit;
      }

      .ins-notion-content figure,
      .ins-notion-content .notion-asset-wrapper {
        margin-top: 50px !important;
        margin-bottom: 50px !important;
      }

      .ins-notion-content img {
        border-radius: var(--ins-radius);
      }

      .ins-notion-content figcaption,
      .ins-notion-content .notion-asset-caption {
        margin-top: 13px !important;
        color: var(--ins-muted-2) !important;
        font-size: 13px !important;
        line-height: 1.68 !important;
        text-align: center;
        letter-spacing: 0.02em;
      }

      /* Reuse the viewport drawer with an unframed, page-colored appearance. */
      .ins-reading-toc,
      .ins-reading-toc * {
        box-sizing: border-box;
      }

      .ins-reading-toc {
        position: fixed;
        top: 50%;
        left: calc(50% + 477px);
        transform: translateY(-50%);
        width: 44px;
        z-index: 60;
        font-family: var(--ins-ui-font);
      }

      .ins-reading-toc-trigger {
        width: 44px;
        height: auto;
        max-height: 72vh;
        padding: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 0;
        background: var(--ins-bg);
        box-shadow: none;
        color: var(--ins-muted);
        font: inherit;
        cursor: pointer;
      }

      .ins-reading-toc-mark:focus-visible,
      .ins-reading-toc-panel a:focus-visible {
        outline: 1px solid currentColor;
        outline-offset: 3px;
      }

      .ins-reading-toc-marks {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: min(5px, calc(8vh / var(--ins-toc-count)));
        max-height: calc(68vh - 24px);
        overflow-y: auto;
        scrollbar-width: none;
      }

      .ins-reading-toc-marks::-webkit-scrollbar {
        display: none;
      }

      .ins-reading-toc-mark {
        width: 20px;
        height: 24px;
        min-height: 1px;
        max-height: 24px;
        flex: 1 1 24px;
        display: flex;
        align-items: stretch;
        justify-content: center;
        color: inherit;
        text-decoration: none !important;
        cursor: pointer;
      }

      .ins-reading-toc-mark > span {
        width: 4px;
        height: 100%;
        border-radius: 999px;
        background: currentColor;
        transform-origin: center;
        transition: transform 180ms ease, background-color 180ms ease;
      }

      .ins-reading-toc-trigger:hover .ins-reading-toc-mark > span {
        transform: scaleX(1.5);
      }

      .ins-reading-toc-trigger .ins-reading-toc-mark:hover > span,
      .ins-reading-toc-trigger .ins-reading-toc-mark:focus-visible > span {
        transform: scaleX(2);
        background: var(--ins-pink);
      }

      .ins-reading-toc-panel {
        position: absolute;
        left: 100%;
        right: auto;
        top: 50%;
        transform: translateY(-50%);
        width: min(260px, calc(50vw - 541px));
        animation: ins-toc-drawer-in 220ms ease-out both;
        max-height: min(72vh, 580px);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 12px 16px;
        border: 0;
        border-radius: 0;
        background: var(--ins-bg);
        box-shadow: none;
        color: var(--ins-muted);
      }

      @keyframes ins-toc-drawer-in {
        from {
          opacity: 0;
          transform: translate(-12px, -50%);
        }
        to {
          opacity: 1;
          transform: translate(0, -50%);
        }
      }

      .ins-reading-toc-panel a {
        display: block;
        padding: 10px 4px;
        color: inherit;
        font-size: 13px;
        line-height: 1.6;
        overflow-wrap: anywhere;
        text-decoration: none;
        transition: transform 180ms ease, color 180ms ease;
      }

      .ins-reading-toc-panel a.is-sub {
        padding-left: 16px;
      }

      .ins-reading-toc-panel a:hover,
      .ins-reading-toc-panel a:focus-visible {
        transform: translateX(4px);
        color: var(--ins-pink);
        text-decoration: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .ins-reading-toc-panel {
          animation: none;
        }
        .ins-reading-toc-mark > span {
          transition: none;
        }
        .ins-reading-toc-panel a {
          transition: none;
        }
        .ins-reading-toc-panel a:hover,
        .ins-reading-toc-panel a:focus-visible {
          transform: none;
        }
      }

      .ins-notion-content h1,
      .ins-notion-content h2,
      .ins-notion-content h3,
      .ins-notion-content h4,
      .ins-notion-content .notion-h1,
      .ins-notion-content .notion-h2,
      .ins-notion-content .notion-h3,
      .ins-notion-content .notion-h4 {
        scroll-margin-top: 32px;
      }

      /* Below wide-desktop widths there is no right-side TOC or reserved gutter. */
      @media (max-width: 1399px) {
        .ins-reading-toc {
          display: none;
        }
      }

      .ins-article-end {
        margin-top: 62px;
        padding-top: 32px;
        border-top: 1px solid var(--ins-line);
      }

      .ins-tag-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 34px;
      }

      .ins-tag {
        padding: 5px 11px;
        border: 1px solid rgba(237, 142, 172, 0.36);
        border-radius: 999px;
        color: var(--ins-pink) !important;
        font-size: 12px;
        line-height: 1.5;
      }

      .ins-tag:hover,
      .ins-tag:focus-visible {
        color: var(--ins-bg) !important;
        background: var(--ins-pink);
        border-color: var(--ins-pink);
        text-decoration: none !important;
      }

      .ins-post-nav {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 28px;
      }

      .ins-post-nav a {
        padding: 20px 22px;
        border: 1px solid var(--ins-line);
        border-radius: var(--ins-radius);
        background: rgba(43, 57, 66, 0.62);
        color: var(--ins-muted) !important;
        font-size: 12px;
        line-height: 1.55;
      }

      .ins-post-nav a:hover {
        background: var(--ins-surface);
        text-decoration: none !important;
      }

      .ins-post-nav strong {
        display: block;
        margin-top: 5px;
        color: var(--ins-text);
        font-family: Georgia, "Songti SC", "STSong", serif;
        font-size: 16px;
        line-height: 1.5;
      }

      .ins-post-nav a:last-child {
        text-align: right;
      }

      .ins-article-loading {
        width: min(810px, calc(100% - 68px));
        margin: 0 auto;
        padding: 100px 0;
        color: var(--ins-muted-2);
      }

      @media (max-width: 760px) {
        .ins-article-header {
          width: 100%;
          margin-left: 0;
          margin-right: 0;
          padding: 56px 20px 36px;
          box-sizing: border-box;
        }

        .ins-article-title {
          font-size: 40px;
        }

        .ins-article-layout {
          width: 100%;
          margin-left: 0;
          margin-right: 0;
          padding: 6px 20px 82px;
          box-sizing: border-box;
        }

        .ins-article-body,
        .ins-notion-content p,
        .ins-notion-content .notion-text {
          font-size: 16.5px;
          line-height: 1.94;
        }

        .ins-article-lead {
          font-size: 18px;
        }

        .ins-notion-content h1,
        .ins-notion-content .notion-h1 {
          font-size: 32px;
        }

        .ins-notion-content h2,
        .ins-notion-content .notion-h2 {
          font-size: 28px;
        }

        .ins-notion-content h3,
        .ins-notion-content .notion-h3 {
          font-size: 21px;
        }

        .ins-post-nav {
          grid-template-columns: 1fr;
        }

        .ins-post-nav a:last-child {
          text-align: left;
        }
      }
    `}</style>
  )
}
