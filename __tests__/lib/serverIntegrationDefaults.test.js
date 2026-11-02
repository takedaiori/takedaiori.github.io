jest.mock('@/lib/plugins/mailchimp', () => ({ __esModule: true, default: jest.fn() }))
import subscribe from '@/pages/api/subscribe'
import oauth from '@/pages/api/auth/callback/notion'

describe('unreviewed server integrations stay closed', () => {
  test('subscription cannot write merely because provider credentials exist', async () => {
    const previous = process.env.SERVER_SUBSCRIPTIONS_ENABLED
    delete process.env.SERVER_SUBSCRIPTIONS_ENABLED
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    try {
      await subscribe({ method: 'POST', body: { email: 'test@example.invalid' } }, res)
      expect(res.status).toHaveBeenCalledWith(503)
    } finally {
      if (previous === undefined) delete process.env.SERVER_SUBSCRIPTIONS_ENABLED
      else process.env.SERVER_SUBSCRIPTIONS_ENABLED = previous
    }
  })
  test('legacy OAuth never exchanges codes or redirects tokens', () => {
    const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn(), redirect: jest.fn() }
    oauth({ method: 'GET', query: { code: 'test-code' } }, res)
    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
  })
})
