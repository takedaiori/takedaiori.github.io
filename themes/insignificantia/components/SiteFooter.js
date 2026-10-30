const SiteFooter = () => {
  return (
    <footer className='ins-site-footer'>
      {/* Only blank space opens the guide; text and legal links sit above it. */}
      <a
        className='ins-footer-guide-area'
        href='/design-guide'
        data-ins-guide-enter='true'
        aria-label='从页脚空白处打开设计指南'
      />
      <div className='ins-footer-content'>
        <div className='ins-footer-heading'>
          <strong className='ins-footer-brand'>Insignificantia.</strong>
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
