export const ArchiveStyle = () => {
  return (
    <style jsx global>{`
      .ins-archive-page {
        width: min(980px, calc(100% - 68px));
        margin: 0 auto;
        padding: 76px 0 120px;
      }

      .ins-archive-header {
        margin-bottom: 34px;
      }

      .ins-archive-grid {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 24px;
        justify-content: center;
      }

      .ins-archive-year-grid {
        margin-top: 136px;
      }

      .ins-archive-card {
        aspect-ratio: 1 / 1;
        padding: 27px;
        border: 1px solid var(--ins-line);
        border-radius: var(--ins-radius);
        background: var(--ins-surface);
        box-shadow:
          0 10px 28px rgba(5, 12, 16, 0.18);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: var(--ins-text) !important;
        transition:
          transform 180ms ease,
          background 180ms ease,
          border-color 180ms ease,
          box-shadow 180ms ease;
      }

      .ins-archive-card:hover {
        transform: translateY(-3px);
        background: var(--ins-surface-hover);
        border-color: rgba(237, 142, 172, 0.62);
        box-shadow:
          0 18px 38px rgba(5, 12, 16, 0.26);
        text-decoration: none !important;
      }

      .ins-archive-card strong {
        color: var(--ins-text);
        font-size: clamp(27px, 3vw, 42px);
        line-height: 1.08;
        letter-spacing: -0.035em;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .ins-archive-card:hover strong {
        color: var(--ins-pink);
      }

      .ins-archive-card small {
        color: var(--ins-muted-2);
        font-size: 11px;
        line-height: 1.5;
        letter-spacing: 0.11em;
      }

      @media (max-width: 1050px) {
        .ins-archive-page {
          width: min(760px, calc(100% - 68px));
        }

        .ins-archive-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .ins-archive-page {
          width: 100%;
          margin-left: 0;
          margin-right: 0;
          padding: 54px 18px 86px;
          box-sizing: border-box;
        }

        .ins-archive-header {
          margin-bottom: 28px;
        }

        .ins-archive-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .ins-archive-year-grid {
          margin-top: 64px;
        }

        .ins-archive-card {
          aspect-ratio: 1.18 / 1;
          padding: 16px;
        }

        .ins-archive-card strong {
          font-size: clamp(22px, 6.2vw, 28px);
          line-height: 1.08;
        }

        .ins-archive-card small {
          font-size: 10px;
          line-height: 1.35;
          letter-spacing: 0.08em;
        }
      }

      @media (max-width: 520px) {
        .ins-archive-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .ins-archive-card {
          aspect-ratio: 1.18 / 1;
          padding: 16px;
        }

        .ins-archive-card strong {
          font-size: clamp(21px, 6.4vw, 25px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ins-archive-card {
          transition: none !important;
        }
      }
    `}</style>
  )
}
