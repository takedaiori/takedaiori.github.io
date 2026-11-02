import { act, fireEvent, render, screen } from '@testing-library/react'
import FullScreenButton from '@/components/FullScreenButton'

describe('native fullscreen replacement', () => {
  afterEach(() => {
    delete document.documentElement.requestFullscreen
    delete document.exitFullscreen
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
    document.getElementById('myIframe')?.remove()
  })
  test('can target the legacy iframe and follows Escape/fullscreenchange', async () => {
    const frame = document.createElement('iframe')
    frame.id = 'myIframe'
    frame.requestFullscreen = jest.fn(async () => {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: frame })
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    document.body.appendChild(frame)
    render(<FullScreenButton targetId='myIframe' />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '进入全屏' })))
    expect(frame.requestFullscreen).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: '退出全屏' })).toBeInTheDocument()
    act(() => {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    expect(screen.getByRole('button', { name: '进入全屏' })).toBeInTheDocument()
  })
  test('denied and missing targets do not claim fullscreen success', async () => {
    document.documentElement.requestFullscreen = jest.fn().mockRejectedValue(new Error('Denied'))
    const view = render(<FullScreenButton />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '进入全屏' })))
    expect(screen.getByRole('button', { name: '进入全屏' })).toBeInTheDocument()
    view.rerender(<FullScreenButton targetId='missing' />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '进入全屏' })))
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1)
  })
  test('exit uses the actual fullscreen state', async () => {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.documentElement })
    document.exitFullscreen = jest.fn(async () => {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
    })
    render(<FullScreenButton />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '退出全屏' })))
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: '进入全屏' })).toBeInTheDocument()
  })
})
