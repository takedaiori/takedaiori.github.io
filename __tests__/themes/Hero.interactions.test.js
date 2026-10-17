import { render, screen, fireEvent, act } from '@testing-library/react'
import Hero from '@/themes/insignificantia/components/Hero'

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => <a {...props}>{children}</a> }))
const active = container => container.querySelector('.ins-slide.active img').getAttribute('src')

test('left/right and touch gestures have independent directions; vertical scrolling does not advance', () => {
 const { container, unmount } = render(<Hero />)
 const carousel = container.querySelector('.ins-carousel')
 fireEvent.click(screen.getByRole('button', { name: '上一张' }))
 expect(active(container)).toContain('hero-03')
 expect(carousel.dataset.direction).toBe('prev')
 fireEvent.click(screen.getByRole('button', { name: '下一张' }))
 expect(active(container)).toContain('hero-01')
 expect(carousel.dataset.direction).toBe('next')
 fireEvent.touchStart(carousel, { touches: [{ clientX: 200, clientY: 100 }] })
 fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 80, clientY: 105 }] })
 expect(active(container)).toContain('hero-02')
 fireEvent.touchStart(carousel, { touches: [{ clientX: 80, clientY: 100 }] })
 fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 200, clientY: 105 }] })
 expect(active(container)).toContain('hero-01')
 expect(carousel.dataset.direction).toBe('prev')
 fireEvent.touchStart(carousel, { touches: [{ clientX: 100, clientY: 100 }] })
 fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 120, clientY: 230 }] })
 expect(active(container)).toContain('hero-01')
 unmount()
})

test('automatic rotation still advances after seven seconds', () => {
 jest.useFakeTimers()
 const { container, unmount } = render(<Hero />)
 act(() => jest.advanceTimersByTime(7000))
 expect(active(container)).toContain('hero-02')
 expect(container.querySelector('.ins-carousel').dataset.direction).toBe('next')
 unmount(); jest.useRealTimers()
})

class MousePointerEvent extends MouseEvent {
 constructor(type, options) {
  super(type, options)
  this.pointerId = options.pointerId ?? 1
  this.pointerType = options.pointerType ?? 'mouse'
 }
}

test('mouse drag supports both directions and pointer capture; controls and vertical drags are excluded', () => {
 const originalPointerEvent = window.PointerEvent
 window.PointerEvent = MousePointerEvent
 const { container, unmount } = render(<Hero />)
 const carousel = container.querySelector('.ins-carousel')
 carousel.setPointerCapture = jest.fn()
 carousel.hasPointerCapture = jest.fn(() => true)
 carousel.releasePointerCapture = jest.fn()
 const drag = (x1, y1, x2, y2, extra = {}) => {
  fireEvent.pointerDown(carousel, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: x1, clientY: y1, ...extra })
  fireEvent.pointerUp(carousel, { pointerId: 1, pointerType: 'mouse', clientX: x2, clientY: y2, ...extra })
 }
 drag(200, 100, 80, 105)
 expect(active(container)).toContain('hero-02')
 expect(carousel.dataset.direction).toBe('next')
 expect(carousel.setPointerCapture).toHaveBeenCalledWith(1)
 expect(carousel.releasePointerCapture).toHaveBeenCalledWith(1)
 expect(carousel.dataset.dragging).toBe('false')
 drag(80, 100, 200, 105)
 expect(active(container)).toContain('hero-01')
 expect(carousel.dataset.direction).toBe('prev')
 drag(100, 100, 120, 230)
 drag(100, 100, 90, 100)
 drag(200, 100, 80, 100, { button: 2 })
 expect(active(container)).toContain('hero-01')
 fireEvent.pointerDown(screen.getByRole('button', { name: '下一张' }), { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 200, clientY: 100 })
 fireEvent.pointerUp(carousel, { pointerId: 1, pointerType: 'mouse', clientX: 80, clientY: 100 })
 expect(active(container)).toContain('hero-01')
 fireEvent.click(screen.getByRole('button', { name: '下一张' }))
 expect(active(container)).toContain('hero-02')
 expect(container.querySelector('.ins-slide-label')).toBeNull()
 expect(screen.queryByText('DESIGN / 01')).toBeNull()
 fireEvent.pointerDown(carousel, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 200, clientY: 100 })
 fireEvent.pointerCancel(carousel, { pointerId: 1, pointerType: 'mouse' })
 fireEvent.pointerUp(carousel, { pointerId: 1, pointerType: 'mouse', clientX: 80, clientY: 100 })
 expect(active(container)).toContain('hero-02')
 unmount()
 window.PointerEvent = originalPointerEvent
})
