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
