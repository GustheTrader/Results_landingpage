// Ultra-simple handler to debug
export default async function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'text/html')
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Debug Test</title>
      </head>
      <body>
        <h1>✅ API Function is Working!</h1>
        <p>URL: ${req.url}</p>
        <p>Method: ${req.method}</p>
        <p>If you see this, the function works!</p>
      </body>
      </html>
    `)
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack })
  }
}
