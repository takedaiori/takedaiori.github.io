import { getAuth } from '@clerk/nextjs/server'
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Clerk 身份测试
 * @param req
 * @param res
 * @returns
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return res.status(503).json({ error: 'Authentication is not configured' })
  }
  try {
    const { userId } = getAuth(req)

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Retrieve data from your database
    res.status(200).json({ userId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
