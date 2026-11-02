import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'

/**
 * 滚动阻尼特效
 * 目前只用在proxio主题
 * @returns
 */
const Lenis = () => {
  useEffect(() => {
    let disposed = false
    let frameId = null
    let instance = null
    // 异步加载
    async function loadLenis() {
      try {
        await loadExternalResource('/js/lenis.js', 'js')

        // console.log('Lenis', window.Lenis)
        if (disposed) return
        if (!window.Lenis) {
          console.error('Lenis not loaded')
          return
        }
        const Lenis = window.Lenis

        // 创建 Lenis 实例
        const lenis = new Lenis({
          duration: 1.2,
          easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
          direction: 'vertical', // vertical, horizontal
          gestureDirection: 'vertical', // vertical, horizontal, both
          smooth: true,
          mouseMultiplier: 1,
          smoothTouch: false,
          touchMultiplier: 2,
          infinite: false
        })

        // 存储实例到 ref
        instance = lenis

        // 监听滚动事件
        // lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
        //   // console.log({ scroll, limit, velocity, direction, progress })
        // })

        // 动画帧循环
        function raf(time) {
          if (disposed) return
          lenis.raf(time)
          frameId = requestAnimationFrame(raf)
        }

        frameId = requestAnimationFrame(raf)
      } catch (error) {
        console.error('Failed to load Lenis:', error)
      }
    }

    loadLenis()

    return () => {
      disposed = true
      if (frameId !== null) cancelAnimationFrame(frameId)
      instance?.destroy()
    }
  }, [])

  return <></>
}

export default Lenis
