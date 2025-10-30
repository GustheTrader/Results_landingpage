// Vercel serverless function handler for Hono app
import app from '../dist/index.js'

export default async function handler(req, res) {
  // Convert Vercel request to standard Request object
  const url = `https://${req.headers.host}${req.url}`
  const method = req.method
  const headers = new Headers(req.headers)

  let body = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    body = req.body ? JSON.stringify(req.body) : undefined
  }

  const request = new Request(url, {
    method,
    headers,
    body
  })

  // Pass Vercel environment variables to Hono app context
  const env = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  }

  // Call Hono app with environment context
  const response = await app.fetch(request, env)

  // Convert Response to Vercel response
  res.status(response.status)

  // Set headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  // Send body
  const text = await response.text()
  res.send(text)
}
