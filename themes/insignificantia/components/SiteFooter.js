const SiteFooter = () => {
  return (
    <footer className='ins-site-footer'>
      <a
        className='ins-footer-link'
        href='/design-guide'
        data-ins-guide-enter='true'
        aria-label='查看 Insignificantia 设计指南'>
        <div className='ins-footer-inner'>
          <strong>Insignificantia.</strong>
          <span>© 2026 · Powered by NotionNext · Hosted with GitHub Pages</span>
        </div>
      </a>
      <nav className='ins-footer-notices' aria-label='站点声明'>
        <a href='/content-rights.html'>内容与许可</a>
        <a href='/privacy.html'>隐私说明</a>
      </nav>
    </footer>
  )
}

export default SiteFooter
