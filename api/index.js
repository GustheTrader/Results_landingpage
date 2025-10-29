// Temporary simple version to verify everything works
// This will be replaced with full app once we confirm it loads

export default async function handler(req, res) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFL Edge Betting Results</title>
  <link href="/static/style.css" rel="stylesheet" />
</head>
<body>
  <div data-dashboard-root style="position: relative; z-index: 1;">
    <header class="relative border-b border-slate-700/50">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <div class="reveal">
          <div class="inline-block">
            <p class="text-sm uppercase tracking-widest font-semibold gradient-accent bg-clip-text text-transparent">ROI Performance Dashboard</p>
          </div>
          <h1 class="mt-4 text-5xl font-bold text-white md:text-6xl lg:text-7xl bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            NFL Edge Betting Results
          </h1>
          <p class="mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
            Live view of current bets in market plus historical week-by-week ROI pulled directly from your uploaded PDF reports.
          </p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl space-y-12 px-6 py-12">
      <section class="glass-card rounded-3xl p-8 reveal">
        <h2 class="text-3xl font-bold text-white mb-8 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Portfolio Overview</h2>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border backdrop-blur-sm border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 transition-all hover:scale-105">
            <p class="text-xs uppercase tracking-wider font-semibold text-slate-400">Active Bets</p>
            <p class="mt-3 text-2xl font-bold text-white">0</p>
          </div>
          <div class="rounded-2xl border backdrop-blur-sm border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 transition-all hover:scale-105">
            <p class="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Wagered</p>
            <p class="mt-3 text-2xl font-bold text-white">$0</p>
          </div>
          <div class="rounded-2xl border backdrop-blur-sm border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 transition-all hover:scale-105">
            <p class="text-xs uppercase tracking-wider font-semibold text-slate-400">Lifetime Net</p>
            <p class="mt-3 text-2xl font-bold text-white">$0</p>
          </div>
          <div class="rounded-2xl border backdrop-blur-sm border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6 transition-all hover:scale-105">
            <p class="text-xs uppercase tracking-wider font-semibold text-slate-400">Lifetime ROI</p>
            <p class="mt-3 text-2xl font-bold text-white">0%</p>
          </div>
        </div>
      </section>

      <section class="glass-card rounded-3xl p-8 reveal">
        <div class="flex items-center justify-between gap-4 mb-6">
          <h2 class="text-3xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Current Bets In Market</h2>
          <span class="rounded-full gradient-accent px-4 py-2 text-xs uppercase tracking-wider font-bold text-white shadow-lg shadow-green-500/20 animate-pulse">Live</span>
        </div>
        <p class="text-base text-slate-300">No open tickets right now. Database connection will be added next.</p>
      </section>
    </main>

    <footer class="relative border-t border-slate-700/50 glass-card py-8 text-center">
      <p class="text-sm text-slate-400">
        Built for rapid ROI tracking — upload new data from the admin console to refresh live metrics instantly.
      </p>
      <div class="mt-3 flex items-center justify-center gap-2">
        <div class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
        <span class="text-xs text-slate-500">Live Dashboard</span>
      </div>
    </footer>
  </div>
  <script src="/static/app.js"></script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
