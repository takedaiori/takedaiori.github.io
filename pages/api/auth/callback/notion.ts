import type { NextApiRequest, NextApiResponse } from 'next'

/** Disabled until a state-validated OAuth flow and server-side token store exist. */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(503).json({ error: 'Notion OAuth is disabled' })
}
