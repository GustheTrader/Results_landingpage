import type { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../dist/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Convert Vercel request to Fetch API Request
    const url = new URL(req.url || '/', `https://${req.headers.host}`)

    const request = new Request(url, {
      method: req.method || 'GET',
      headers: new Headers(req.headers as Record<string, string>),
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    // Handle with Hono app
    const response = await app.fetch(request, {})

    // Convert Response to Vercel response
    const body = await response.text()
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    res.status(response.status).send(body)
  } catch (error) {
    console.error('Error handling request:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
