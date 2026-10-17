import { render, fireEvent, waitFor } from '@testing-library/react'
import ImageLoading from '@/themes/insignificantia/components/ImageLoading'

test('shows loading only while needed, handles cache, errors, changed src and portal images', async () => {
 const { container, unmount } = render(<div id='theme-insignificantia'><ImageLoading /><div className='ins-carousel'><div><img alt='work' src='/one.webp' /></div></div></div>)
 const image = container.querySelector('img')
 let complete = false
 Object.defineProperty(image, 'complete', { get: () => complete })
 image.setAttribute('src', '/two.webp')
 await waitFor(() => expect(image.parentElement).toHaveClass('ins-image-loading'))
 complete = true; fireEvent.load(image)
 expect(image.parentElement).not.toHaveClass('ins-image-loading')
 complete = false; image.setAttribute('src', '/three.webp')
 await waitFor(() => expect(image.parentElement).toHaveClass('ins-image-loading'))
 fireEvent.error(image)
 expect(image.parentElement).not.toHaveClass('ins-image-loading')
 const lightbox = document.createElement('div'); lightbox.className = 'ins-lightbox'
 const picture = document.createElement('img'); Object.defineProperty(picture, 'complete', { value: false }); lightbox.appendChild(picture); document.body.appendChild(lightbox)
 await waitFor(() => expect(lightbox).toHaveClass('ins-image-loading'))
 fireEvent.error(picture)
 expect(lightbox).not.toHaveClass('ins-image-loading')
 lightbox.remove(); unmount()
})
