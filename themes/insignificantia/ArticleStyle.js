export const ArticleStyle = () => {
  return (
    <style jsx global>{`
      .ins-article-index {
        width: min(900px, calc(100% - 68px));
        margin: 0 auto;
        padding: 76px 0 120px;
      }

      .ins-article-index-header {
        margin: 0 0 34px;
      }

      .ins-result-context {
        display: flex;
        align-items: baseline;
        gap: 16px;
        margin-top: 13px;
        min-width: 0;
      }

      .ins-result-context-label {
        flex: 0 0 auto;
        color: var(--ins-pink);
        font-size: 11px;
        line-height: 1.5;
        font-weight: 700;
        letter-spacing: 0.16em;
      }

      .ins-result-context-value {
        min-width: 0;
        color: var(--ins-text);
        font-size: clamp(31px, 4.8vw, 54px);
        line-height: 1.05;
        font-weight: 760;
        letter-spacing: -0.035em;
        overflow-wrap: anywhere;
      }

      .ins-page-kicker {
        color: var(--ins-pink) !important;
        font-size: 12px;
        line-height: 1.5;
        letter-spacing: 0.15em;
        font-weight: 650;
      }

      .ins-article-index-list {
        display: grid;
        gap: 44px;
      }

      .ins-article-list-card {
        display: block;
        width: 100%;
        padding: 50px 54px 46px;
        border: 1px solid var(--ins-line);
        border-radius: var(--ins-radius);
        background: var(--ins-surface);
        box-shadow: var(--ins-shadow);
        color: var(--ins-text) !important;
        transition:
          background 180ms ease,
          transform 180ms ease,
          box-shadow 180ms ease;
      }

      .ins-article-list-card:hover {
        transform: translateY(-2px);
        background: var(--ins-surface-hover);
        box-shadow:
          0 20px 44px rgba(5, 12, 16, 0.29),
          0 4px 12px rgba(5, 12, 16, 0.18);
        text-decoration: none !important;
      }

      .ins-article-list-date {
        margin: 0 0 14px;
        color: var(--ins-pink);
        font-size: 12px;
        line-height: 1.5;
        font-weight: 620;
        letter-spacing: 0.02em;
      }

      .ins-article-list-card h2 {
        margin: 0 0 18px;
        color: var(--ins-text);
        font-family: Georgia, "Songti SC", "STSong", serif;
        font-size: 31px;
        line-height: 1.34;
        font-weight: 700;
        letter-spacing: -0.012em;
        transition: color 160ms ease;
      }

      .ins-article-list-card:hover h2 {
        color: var(--ins-pink);
      }

      .ins-article-list-card p {
        max-width: 100%;
        margin: 0;
        color: #c8cfcd;
        font-size: 15.5px;
        line-height: 2;
        font-weight: 500;
        letter-spacing: 0.01em;
      }

      .ins-article-list-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-top: 28px;
        padding-top: 20px;
        border-top: 1px solid var(--ins-line);
      }

      .ins-card-category {
        color: var(--ins-pink);
        font-size: 12px;
        line-height: 1.5;
        font-weight: 650;
        letter-spacing: 0.08em;
        overflow-wrap: anywhere;
      }

      .ins-read-more {
        min-height: 40px;
        padding: 7px 15px;
        border: 1px solid rgba(237, 142, 172, 0.5);
        border-radius: var(--ins-radius);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--ins-pink) !important;
        font-size: 13px;
        line-height: 1;
        font-weight: 620;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          color 160ms ease;
      }

      .ins-article-list-card:hover .ins-read-more {
        background: rgba(237, 142, 172, 0.08);
        border-color: rgba(237, 142, 172, 0.72);
        color: var(--ins-pink-hover) !important;
      }

      .ins-pagination {
        display: flex;
        justify-content: center;
        gap: 11px;
        margin-top: 56px;
        flex-wrap: wrap;
      }

      .ins-page-dot {
        width: 42px;
        height: 42px;
        border: 1px solid var(--ins-line-strong);
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--ins-muted) !important;
        font-size: 13px;
        line-height: 1;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          color 160ms ease,
          transform 160ms ease;
      }

      .ins-page-dot:hover,
      .ins-page-dot.is-current {
        background: var(--ins-pink);
        border-color: var(--ins-pink);
        color: #253039 !important;
        text-decoration: none !important;
      }

      .ins-page-dot:hover {
        transform: translateY(-1px);
      }

      .ins-article-list-empty {
        padding: 48px;
        border: 1px dashed var(--ins-line);
        border-radius: var(--ins-radius);
        color: var(--ins-muted-2);
        text-align: center;
      }

      @media (max-width: 760px) {
        .ins-article-index {
          width: 100%;
          margin-left: 0;
          margin-right: 0;
          padding: 54px 18px 86px;
          box-sizing: border-box;
        }

        .ins-article-index-header {
          margin-bottom: 28px;
        }

        .ins-result-context {
          gap: 11px;
          margin-top: 11px;
        }

        .ins-result-context-value {
          font-size: 34px;
        }

        .ins-article-index-list {
          gap: 36px;
        }

        .ins-article-list-card {
          padding: 36px 28px 38px;
        }

        .ins-article-list-card h2 {
          font-size: 27px;
        }

        .ins-article-list-card p {
          font-size: 15px;
        }

        .ins-article-list-actions {
          gap: 14px;
        }

        .ins-card-category {
          font-size: 11.5px;
        }

        .ins-pagination {
          gap: 10px;
          margin-top: 48px;
        }

        .ins-page-dot {
          width: 39px;
          height: 39px;
        }
      }

      @media (max-width: 520px) {
        .ins-article-list-card {
          padding-left: 24px;
          padding-right: 24px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ins-article-list-card,
        .ins-page-dot,
        .ins-read-more {
          transition: none !important;
        }
      }
    `}</style>
  )
}
