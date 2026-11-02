import { useEffect, useState } from 'react'

const currentFullscreen = () =>
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.mozFullScreenElement ||
  document.msFullscreenElement

/** Uses the native permission-checked API for the page or a specified element. */
const FullScreenButton = ({ targetId }) => {
  const [isFullScreen, setIsFullScreen] = useState(false)
  useEffect(() => {
    const sync = () => setIsFullScreen(Boolean(currentFullscreen()))
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ]
    sync()
    events.forEach(event => document.addEventListener(event, sync))
    return () =>
      events.forEach(event => document.removeEventListener(event, sync))
  }, [])

  const handleFullScreenClick = async () => {
    const target = targetId
      ? document.getElementById(targetId)
      : document.documentElement
    if (!target) return
    try {
      if (currentFullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen()
        else if (document.webkitExitFullscreen)
          await document.webkitExitFullscreen()
        else if (document.mozCancelFullScreen)
          await document.mozCancelFullScreen()
        else if (document.msExitFullscreen) await document.msExitFullscreen()
      } else {
        if (target.requestFullscreen) await target.requestFullscreen()
        else if (target.webkitRequestFullscreen)
          await target.webkitRequestFullscreen()
        else if (target.mozRequestFullScreen)
          await target.mozRequestFullScreen()
        else if (target.msRequestFullscreen) await target.msRequestFullscreen()
      }
      setIsFullScreen(Boolean(currentFullscreen()))
    } catch {
      // A denied request must not leave an optimistic fullscreen state behind.
      setIsFullScreen(Boolean(currentFullscreen()))
    }
  }

  return (
    <button
      onClick={() => {
        void handleFullScreenClick()
      }}
      className='dark:text-gray-300'
      aria-label={isFullScreen ? '退出全屏' : '进入全屏'}
    >
      {isFullScreen ? '退出全屏' : <i className='fa-solid fa-expand' />}
    </button>
  )
}

export default FullScreenButton
