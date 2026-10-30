const SiteFooter = () => {
  return (
    <footer className='ins-site-footer'>
      {/* Restore the full footer target without nesting the legal links. */}
      <a
        className='ins-footer-guide-area'
        href='/design-guide'
        data-ins-guide-enter='true'
        aria-hidden='true'
        tabIndex={-1}
      />
      <div className='ins-footer-content'>
        <div className='ins-footer-heading'>
          <a
            className='ins-footer-brand-link'
            href='/design-guide'
            data-ins-guide-enter='true'
            aria-label='查看 Insignificantia 设计指南'>
            <strong>Insignificantia.</strong>
          </a>
          <nav className='ins-footer-inline-notices' aria-label='站点声明'>
            <a href='/content-rights.html'>内容与许可</a>
            <a href='/privacy.html'>隐私说明</a>
          </nav>
        </div>
        <span className='ins-footer-credit'>© 2026 · Powered by NotionNext · Hosted with GitHub Pages</span>
      </div>
    </footer>
  )
}

export default SiteFooter
