import { render, fireEvent, waitFor, act } from '@testing-library/react'
import ImageLoading from '@/themes/insignificantia/components/ImageLoading'

const installController = () => {
  // _document loads this script before React in the real application.
  jest.isolateModules(() => { require('@/public/image-reveal') })
}

const mockImage = (image, initial = false) => {
  const state = { complete: initial, valid: initial }
  Object.defineProperty(image, 'complete', { configurable: true, get: () => state.complete })
  Object.defineProperty(image, 'naturalWidth', { configurable: true, get: () => state.valid ? 400 : 0 })
  image.decode = jest.fn(() => Promise.resolve())
  return state
}

afterEach(() => {
  window.InsignificantiaImages?.destroy()
  document.querySelectorAll('.ins-lightbox').forEach(node => node.remove())
})

test('shows loading only while needed, handles cache, errors, changed src and portal images', async () => {
  const { container, unmount } = render(
    <div id='theme-insignificantia'>
      <ImageLoading />
      <div className='ins-carousel'><div><img alt='work' src='/one.webp' /></div></div>
    </div>
  )
  const image = container.querySelector('img')
  const state = mockImage(image)
  installController()
  image.setAttribute('src', '/two.webp')
  await waitFor(() => expect(image.parentElement).toHaveClass('ins-image-loading'))
  state.complete = true
  state.valid = true
  fireEvent.load(image)
  await waitFor(() => expect(image).toHaveAttribute('data-ins-image-state', 'ready'))
  expect(image.parentElement).not.toHaveClass('ins-image-loading')

  state.complete = false
  state.valid = false
  image.setAttribute('src', '/three.webp')
  await waitFor(() => expect(image.parentElement).toHaveClass('ins-image-loading'))
  state.complete = true
  fireEvent.error(image)
  expect(image.parentElement).not.toHaveClass('ins-image-loading')
  expect(image).toHaveAttribute('data-ins-image-state', 'error')

  const lightbox = document.createElement('div')
  lightbox.className = 'ins-lightbox'
  const picture = document.createElement('img')
  const portalState = mockImage(picture)
  picture.src = '/portal.webp'
  lightbox.appendChild(picture)
  document.body.appendChild(lightbox)
  await waitFor(() => expect(lightbox).toHaveClass('ins-image-loading'))
  portalState.complete = true
  fireEvent.error(picture)
  expect(lightbox).not.toHaveClass('ins-image-loading')

  // Cached resources still need decoding, without requiring another load event.
  const cached = document.createElement('img')
  mockImage(cached, true)
  cached.src = '/cached.webp'
  lightbox.appendChild(cached)
  await waitFor(() => expect(cached).toHaveAttribute('data-ins-image-state', 'ready'))
  lightbox.remove()
  unmount()
})

test('waits for full image decoding and rejects stale completions after a source change', async () => {
  const { container } = render(
    <div id='theme-insignificantia'>
      <div className='ins-notion-content'>
        <figure className='notion-asset-wrapper'>
          <div className='lazy-image-wrapper'>
            <img className='lazy-image-preview' alt='preview' src='/preview.webp' />
            <img className='lazy-image-real' alt='full' src='/full.webp' />
          </div>
          <figcaption className='notion-asset-caption'>Image caption</figcaption>
        </figure>
      </div>
    </div>
  )
  const image = container.querySelector('.lazy-image-real')
  const host = container.querySelector('figure')
  const state = mockImage(image, true)
  let finishOld
  let finishNew
  const oldDecode = new Promise(resolve => { finishOld = resolve })
  const newDecode = new Promise(resolve => { finishNew = resolve })
  image.decode = jest.fn().mockReturnValueOnce(oldDecode).mockReturnValueOnce(newDecode)
  installController()
  await waitFor(() => expect(image.decode).toHaveBeenCalledTimes(1))
  expect(host).toHaveAttribute('data-ins-image-group', 'pending')
  expect(container.querySelector('.lazy-image-preview')).not.toHaveAttribute('data-ins-image-state')

  image.setAttribute('src', '/replacement.webp')
  await waitFor(() => expect(image.decode).toHaveBeenCalledTimes(2))
  await act(async () => { finishOld(); await oldDecode })
  expect(image).toHaveAttribute('data-ins-image-state', 'pending')
  expect(host).toHaveAttribute('data-ins-image-group', 'pending')
  await act(async () => { finishNew(); await newDecode })
  await waitFor(() => expect(host).toHaveAttribute('data-ins-image-group', 'ready'))

  state.valid = false
  image.setAttribute('src', '/broken.webp')
  fireEvent.error(image)
  await waitFor(() => expect(host).toHaveAttribute('data-ins-image-group', 'error'))
  expect(host).not.toHaveClass('ins-image-loading')
})
