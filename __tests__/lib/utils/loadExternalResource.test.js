import { loadExternalResource } from '@/lib/utils'

describe('loadExternalResource', () => {
  afterEach(() => {
    document.head
      .querySelectorAll('[data-test-resource]')
      .forEach(tag => tag.remove())
  })

  it('applies SRI and rejects an existing unprotected script', async () => {
    const url = 'https://cdnjs.cloudflare.com/ajax/libs/wow/1.1.2/wow.min.js'
    const integrity = 'sha384-test-fixture'
    const pending = loadExternalResource(url, 'js', { integrity })
    const script = document.head.querySelector(`script[src='${url}']`)
    script.dataset.testResource = 'true'
    expect(script.getAttribute('integrity')).toBe(integrity)
    expect(script.crossOrigin).toBe('anonymous')
    script.dispatchEvent(new Event('load'))
    await expect(pending).resolves.toBe(url)
    await expect(loadExternalResource(url, 'js', { integrity })).resolves.toBe(url)
    script.removeAttribute('integrity')
    await expect(loadExternalResource(url, 'js', { integrity })).rejects.toThrow('integrity')
  })

  it('waits for an existing script to finish loading', async () => {
    const url = '/js/typed.min.js'
    const first = loadExternalResource(url, 'js')
    const script = document.head.querySelector(`script[src='${url}']`)
    script.dataset.testResource = 'true'

    const second = loadExternalResource(url, 'js')
    let settled = false
    second.then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)
    expect(document.head.querySelectorAll(`script[src='${url}']`)).toHaveLength(
      1
    )

    script.dispatchEvent(new Event('load'))
    await expect(first).resolves.toBe(url)
    await expect(second).resolves.toBe(url)
    await expect(loadExternalResource(url, 'js')).resolves.toBe(url)
  })

  it('removes a failed script so a later call can retry', async () => {
    const url = '/js/retry.js'
    const first = loadExternalResource(url, 'js')
    const script = document.head.querySelector(`script[src='${url}']`)
    script.dataset.testResource = 'true'
    script.dispatchEvent(new Event('error'))
    await expect(first).rejects.toBe(url)
    expect(script.isConnected).toBe(false)

    const retry = loadExternalResource(url, 'js')
    const newScript = document.head.querySelector(`script[src='${url}']`)
    newScript.dataset.testResource = 'true'
    expect(newScript).not.toBe(script)
    newScript.dispatchEvent(new Event('load'))
    await expect(retry).resolves.toBe(url)
  })
})
