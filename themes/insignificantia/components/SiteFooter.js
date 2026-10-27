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
    </footer>
  )
}

export default SiteFooter
