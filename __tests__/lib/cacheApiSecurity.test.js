jest.mock('@/lib/cache/local_file_cache', () => ({ cleanCache: jest.fn() }))
import handler from '@/pages/api/cache'
import { cleanCache } from '@/lib/cache/local_file_cache'

describe('server cache maintenance authorization', () => {
  const saved = process.env.CACHE_REVALIDATION_TOKEN
  afterEach(() => {
    if (saved === undefined) delete process.env.CACHE_REVALIDATION_TOKEN
    else process.env.CACHE_REVALIDATION_TOKEN = saved
    jest.clearAllMocks()
  })
  const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() })
  test('fails closed without a configured token', () => {
    delete process.env.CACHE_REVALIDATION_TOKEN
    const res = response()
    handler({ method: 'POST', headers: {} }, res)
    expect(res.status).toHaveBeenCalledWith(503)
    expect(cleanCache).not.toHaveBeenCalled()
  })
  test('rejects missing credentials and accepts the configured bearer', () => {
    process.env.CACHE_REVALIDATION_TOKEN = 'test-token'
    const res = response()
    handler({ method: 'POST', headers: {} }, res)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(cleanCache).not.toHaveBeenCalled()
    handler({ method: 'POST', headers: { authorization: 'Bearer test-token' } }, response())
    expect(cleanCache).toHaveBeenCalledTimes(1)
  })
})
