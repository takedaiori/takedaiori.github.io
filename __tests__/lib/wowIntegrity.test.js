import { loadWowJS } from '@/lib/plugins/wow'
import { loadExternalResource } from '@/lib/utils'
const inventory = require('../../vendored-resources.json')
jest.mock('@/lib/utils', () => ({ loadExternalResource: jest.fn().mockResolvedValue(undefined) }))
test('WOW loader passes its audited integrity value to the browser loader', async () => {
  const item = inventory.remote.find(entry => entry.package === 'wowjs')
  const init = jest.fn()
  window.WOW = jest.fn(() => ({ init }))
  try {
    await loadWowJS()
    expect(loadExternalResource).toHaveBeenCalledWith(item.url, 'js', { integrity: item.integrity })
    expect(init).toHaveBeenCalledTimes(1)
  } finally { delete window.WOW }
})
