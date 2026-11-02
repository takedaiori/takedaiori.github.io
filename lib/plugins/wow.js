const { loadExternalResource } = require('../utils')

/**
 * WOWjs动画，结合animate.css使用很方便
 * 是data-aos的平替 aos ≈ wowjs + animate
 */
export const loadWowJS = async () => {
  await loadExternalResource('/css/wow/animate.css', 'css')
  await loadExternalResource(
    'https://cdnjs.cloudflare.com/ajax/libs/wow/1.1.2/wow.min.js',
    'js',
    {
      integrity:
        'sha384-V27yAyb3yYhZbiwaK9Sgxh9Cywkf/H2al4wcrcp/hKF9ZYT7d5saGJFoO/0v1Cgs'
    }
  )
  // 配合animatecss 实现延时滚动动画，和AOS动画相似
  const WOW = window.WOW
  if (WOW) {
    new WOW().init()
  }
}
