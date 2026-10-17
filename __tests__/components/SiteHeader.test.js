import { render, screen, fireEvent, within } from '@testing-library/react'
import SiteHeader from '@/themes/insignificantia/components/SiteHeader'

jest.mock('next/link', () => {
  function MockLink({ children, onClick, ...props }) {
    return <a {...props} onClick={event => { event.preventDefault(); onClick?.(event) }}>{children}</a>
  }
  return { __esModule: true, default: MockLink }
})

it('closes the mobile menu on an outside press and preserves the page click', () => {
  const click = jest.fn()
  const { unmount } = render(<><SiteHeader /><button onClick={click}>Page action</button></>)
  const overflow = document.body.style.overflow
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
  expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible()
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Page action' }))
  fireEvent.click(screen.getByRole('button', { name: 'Page action' }))
  expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).toBeNull()
  expect(click).toHaveBeenCalledTimes(1)
  expect(document.body.style.overflow).toBe(overflow)
  unmount()
})

it('closes with Escape and with a selected navigation link', () => {
  const { unmount } = render(<SiteHeader />)
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
  const nav = screen.getByRole('navigation', { name: 'Mobile navigation' })
  fireEvent.click(within(nav).getByRole('link', { name: 'ABOUT' }))
  expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).toBeNull()
  unmount()
})

it('hides on downward scrolling, shows on upward scrolling and stays visible at the top', () => {
  const raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callback(); return 0 })
  const height = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight')
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 4000 })
  const { container, unmount } = render(<SiteHeader />)
  const header = container.querySelector('header')
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 200 })
  fireEvent.scroll(window)
  expect(header.dataset.hidden).toBe('true')
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 150 })
  fireEvent.scroll(window)
  expect(header.dataset.hidden).toBe('false')
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  fireEvent.scroll(window)
  expect(header.dataset.hidden).toBe('false')
  unmount(); raf.mockRestore()
  if (height) Object.defineProperty(document.documentElement, 'scrollHeight', height)
})
