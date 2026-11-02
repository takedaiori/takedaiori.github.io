import { act, render } from '@testing-library/react'
import Lenis from '@/components/Lenis'
import { loadExternalResource } from '@/lib/utils'
jest.mock('@/lib/utils', () => ({ loadExternalResource: jest.fn() }))

describe('retained Lenis lifecycle', () => {
  const originalRaf = window.requestAnimationFrame
  const originalCancel = window.cancelAnimationFrame
  afterEach(() => {
    window.requestAnimationFrame = originalRaf
    window.cancelAnimationFrame = originalCancel
    delete window.Lenis
    jest.clearAllMocks()
  })
  test('cancels the loop and destroys the instance on unmount', async () => {
    let callback
    window.requestAnimationFrame = jest.fn(fn => { callback = fn; return 42 })
    window.cancelAnimationFrame = jest.fn()
    const instance = { raf: jest.fn(), destroy: jest.fn() }
    window.Lenis = jest.fn(() => instance)
    loadExternalResource.mockResolvedValue('/js/lenis.js')
    const view = render(<Lenis />)
    await act(async () => {})
    view.unmount()
    callback(1)
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42)
    expect(instance.destroy).toHaveBeenCalledTimes(1)
    expect(instance.raf).not.toHaveBeenCalled()
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)
  })
  test('a late script response cannot create an instance after unmount', async () => {
    let finish
    loadExternalResource.mockReturnValue(new Promise(resolve => { finish = resolve }))
    window.Lenis = jest.fn()
    const view = render(<Lenis />)
    view.unmount()
    await act(async () => finish('/js/lenis.js'))
    expect(window.Lenis).not.toHaveBeenCalled()
  })
})
