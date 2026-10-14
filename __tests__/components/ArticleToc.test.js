import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ArticleToc, { findTocTarget } from '@/themes/insignificantia/components/ArticleToc'

const rawId = 'a1234567-b123-c123-d123-e12345678901'
const compactId = rawId.replace(/-/g, '')
const items = [{ id: rawId, text: 'First heading', indentLevel: 0 }]
let root

beforeEach(() => {
  root = document.createElement('article')
  root.innerHTML = '<h2 id="' + compactId + '">First heading</h2>'
  document.body.appendChild(root)
  window.matchMedia.mockReturnValue({ matches: false })
})
afterEach(() => {
  cleanup()
  root.remove()
  window.history.replaceState(window.history.state, '', '/')
})

const mount = () => render(<ArticleToc items={items} articleRef={{ current: root }} postId='post-one' />)

it('matches dashed Notion IDs to compact IDs and block classes', () => {
  expect(findTocTarget(root, rawId)).toBe(root.firstChild)
  root.innerHTML = '<h2 class="notion-block-' + compactId + '">First heading</h2>'
  expect(findTocTarget(root, rawId)).toBe(root.firstChild)
  expect(findTocTarget(root, 'missing')).toBeNull()
})

it('mounts outside the page and closes on an outside press without disabling the page', () => {
  const onClick = jest.fn()
  const outside = document.createElement('button')
  outside.addEventListener('click', onClick)
  document.body.appendChild(outside)
  const { container, unmount } = mount()
  const overflow = document.body.style.overflow
  fireEvent.focus(screen.getByRole('link', { name: '跳转至：First heading' }))
  expect(screen.getByRole('navigation', { name: '文章目录' }).closest('aside').parentElement).toBe(document.body)
  expect(container.querySelector('aside')).toBeNull()
  fireEvent.pointerDown(outside)
  fireEvent.click(outside)
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('navigation', { name: '文章目录' })).toBeNull()
  expect(document.body.style.overflow).toBe(overflow)
  unmount()
  outside.remove()
})

it('scrolls to the rendered heading and keeps the drawer open', () => {
  root.firstChild.scrollIntoView = jest.fn()
  const { unmount } = mount()
  fireEvent.focus(screen.getByRole('link', { name: '跳转至：First heading' }))
  fireEvent.click(screen.getByRole('link', { name: 'First heading' }))
  expect(root.firstChild.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' })
  expect(window.location.hash).toBe('#' + compactId)
  fireEvent.blur(screen.getByRole('link', { name: 'First heading' }), { relatedTarget: document.body })
  expect(screen.getByRole('navigation', { name: '文章目录' })).toBeInTheDocument()
  unmount()
})

it('closes with Escape and honors reduced motion for navigation', () => {
  root.firstChild.scrollIntoView = jest.fn()
  window.matchMedia.mockReturnValue({ matches: true })
  const { unmount } = mount()
  fireEvent.focus(screen.getByRole('link', { name: '跳转至：First heading' }))
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('navigation', { name: '文章目录' })).toBeNull()
  fireEvent.focus(screen.getByRole('link', { name: '跳转至：First heading' }))
  fireEvent.click(screen.getByRole('link', { name: 'First heading' }))
  expect(root.firstChild.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' })
  unmount()
})

it('uses one mark per heading without visible menu labels', () => {
  const { unmount } = mount()
  const trigger = screen.getByRole('link', { name: '跳转至：First heading' })
  expect(trigger.textContent).toBe('')
  expect(document.querySelectorAll('.ins-reading-toc-mark')).toHaveLength(items.length)
  fireEvent.focus(trigger)
  expect(screen.getByRole('navigation', { name: '文章目录' }).textContent).toBe('First heading')
  unmount()
})

it('updates marks when heading count changes and omits empty headings', () => {
  const { rerender, unmount } = mount()
  const headings = Array.from({ length: 7 }, (_, index) => ({ id: 'heading-' + index, text: 'Heading ' + index }))
  rerender(<ArticleToc items={[...headings, { id: 'empty', text: '' }]} articleRef={{ current: root }} postId='post-two' />)
  expect(document.querySelectorAll('.ins-reading-toc-mark')).toHaveLength(7)
  rerender(<ArticleToc items={[]} articleRef={{ current: root }} postId='post-three' />)
  expect(document.querySelector('.ins-reading-toc')).toBeNull()
  unmount()
})

it('makes every mark navigate to its own heading and keeps the menu open after leaving', () => {
  const second = document.createElement('h3')
  second.id = 'second'
  second.textContent = 'Second heading'
  root.appendChild(second)
  root.firstChild.scrollIntoView = jest.fn()
  second.scrollIntoView = jest.fn()
  const { unmount } = render(
    <ArticleToc items={[...items, { id: 'second', text: 'Second heading', indentLevel: 1 }]}
      articleRef={{ current: root }} postId='post-one' />
  )
  fireEvent.click(screen.getByRole('link', { name: '跳转至：Second heading' }))
  expect(second.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' })
  expect(window.location.hash).toBe('#second')
  const leave = new Event('pointerout', { bubbles: true })
  Object.defineProperty(leave, 'pointerType', { value: 'mouse' })
  Object.defineProperty(leave, 'relatedTarget', { value: document.body })
  fireEvent(document.querySelector('.ins-reading-toc'), leave)
  expect(screen.getByRole('navigation', { name: '文章目录' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('link', { name: '跳转至：First heading' }))
  expect(root.firstChild.scrollIntoView).toHaveBeenCalledTimes(1)
  expect(window.location.hash).toBe('#' + compactId)
  expect(screen.getByRole('navigation', { name: '文章目录' })).toBeInTheDocument()
  fireEvent.pointerDown(document.body)
  expect(screen.queryByRole('navigation', { name: '文章目录' })).toBeNull()
  unmount()
})
