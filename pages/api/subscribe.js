import subscribeToMailchimpApi from '@/lib/plugins/mailchimp'

/**
 * 接受邮件订阅
 * @param {*} req
 * @param {*} res
 */
export default async function handler(req, res) {
  if (process.env.SERVER_SUBSCRIPTIONS_ENABLED !== 'true') {
    return res.status(503).json({ error: 'This public write integration requires a server security review before enabling' })
  }

  if (req.method === 'POST') {
    const { email, firstName, lastName } = req.body
    try {
      const response = await subscribeToMailchimpApi({ email, first_name: firstName, last_name: lastName })
      await response.json()
      res.status(200).json({ status: 'success', message: 'Subscription successful!' })
    } catch (error) {
      console.error('Subscription error:', error)
      res.status(400).json({ status: 'error', message: 'Subscription failed!' })
    }
  } else {
    res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }
}
