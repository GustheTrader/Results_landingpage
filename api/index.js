// Simple test handler to verify Vercel routing
export default function handler(req, res) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>NFL Edge Betting Results</title>
        <style>
          body {
            font-family: system-ui;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #0f172a;
            color: white;
          }
          .success {
            padding: 20px;
            background: #10b981;
            border-radius: 10px;
            margin: 20px 0;
          }
          .info {
            padding: 10px;
            background: #1e293b;
            border-radius: 5px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>🎉 Vercel Deployment Working!</h1>
        <div class="success">
          <strong>Success!</strong> Your API handler is now responding on Vercel.
        </div>
        <div class="info">
          <strong>Path:</strong> ${req.url}<br>
          <strong>Method:</strong> ${req.method}
        </div>
        <p>Next step: The full Hono app will be loaded here.</p>
      </body>
    </html>
  `

  res.setHeader('Content-Type', 'text/html')
  res.status(200).send(html)
}
