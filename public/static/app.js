document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-dashboard-root]')
  if (!root) return

  const smoothScrollLinks = root.querySelectorAll('a[href^="#"]')
  smoothScrollLinks.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href')?.substring(1)
      if (!targetId) return
      const target = document.getElementById(targetId)
      if (!target) return
      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })

  const codeBlocks = root.querySelectorAll('code')
  codeBlocks.forEach((code) => {
    code.addEventListener('click', async () => {
      const text = code.textContent?.trim()
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        code.classList.add('copied')
        code.dataset.copied = 'true'
        setTimeout(() => {
          code.classList.remove('copied')
          delete code.dataset.copied
        }, 1500)
      } catch (error) {
        console.warn('Clipboard copy failed', error)
      }
    })
  })

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    },
    { threshold: 0.2 }
  )

  root.querySelectorAll('section').forEach((section) => {
    section.classList.add('reveal')
    observer.observe(section)
  })

  // Live data refresh functionality
  let refreshInterval = null
  let lastRefresh = Date.now()

  // Add live indicator pulsing animation
  const liveIndicators = document.querySelectorAll('.animate-pulse')

  // Format currency for display
  function formatCurrency(value) {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(value)
  }

  // Format percentage for display
  function formatPercent(value) {
    if (value === null || value === undefined) return '—'
    return `${value.toFixed(2)}%`
  }

  // Create a flash animation for updated elements
  function flashUpdate(element) {
    element.style.transition = 'background-color 0.5s ease'
    element.style.backgroundColor = 'rgba(168, 85, 247, 0.2)'
    setTimeout(() => {
      element.style.backgroundColor = ''
    }, 500)
  }

  // Refresh current bets data
  async function refreshCurrentBets() {
    try {
      const response = await fetch('/api/bets?status=pending')
      if (!response.ok) return

      const data = await response.json()
      const bets = data.bets || []

      const currentBetsSection = document.querySelector('#current-bets')
      if (!currentBetsSection) return

      const tbody = currentBetsSection.querySelector('tbody')
      const noBetsMsg = currentBetsSection.querySelector('p')

      if (bets.length === 0) {
        if (tbody) tbody.style.display = 'none'
        if (noBetsMsg) noBetsMsg.style.display = 'block'
      } else {
        if (tbody) {
          tbody.innerHTML = bets.map(bet => `
            <tr>
              <td>
                <div class="font-semibold text-white">${bet.title || '—'}</div>
                ${bet.description ? `<div class="text-xs text-slate-400 mt-1">${bet.description}</div>` : ''}
              </td>
              <td class="font-medium">${formatCurrency(bet.stake)}</td>
              <td class="text-blue-300 font-medium">${bet.odds || '—'}</td>
              <td class="text-slate-300">${bet.event_date || '—'}</td>
              <td class="text-slate-300">${bet.category || '—'}</td>
            </tr>
          `).join('')
          tbody.style.display = 'table-row-group'
          flashUpdate(tbody)
        }
        if (noBetsMsg) noBetsMsg.style.display = 'none'
      }

      // Update active bets count
      const activeBetsElement = document.querySelector('[data-metric="active-bets"]')
      if (activeBetsElement) {
        activeBetsElement.textContent = bets.length.toString()
        flashUpdate(activeBetsElement.closest('.rounded-2xl'))
      }

    } catch (error) {
      console.warn('Failed to refresh current bets:', error)
    }
  }

  // Refresh recent results
  async function refreshRecentResults() {
    try {
      const response = await fetch('/api/bets?status=won,lost,push,void')
      if (!response.ok) return

      const data = await response.json()
      const bets = (data.bets || []).slice(0, 12) // Only show 12 most recent

      const recentResultsSection = document.querySelector('#recent-results')
      if (!recentResultsSection) return

      const tbody = recentResultsSection.querySelector('tbody')
      if (!tbody) return

      if (bets.length === 0) return

      tbody.innerHTML = bets.map(bet => {
        const statusClass =
          bet.status === 'won' ? 'text-emerald-400' :
          bet.status === 'lost' ? 'text-rose-400' :
          bet.status === 'push' ? 'text-amber-400' :
          'text-slate-300'

        return `
          <tr>
            <td>
              <div class="font-semibold text-white">${bet.title || '—'}</div>
              ${bet.category ? `<div class="text-xs text-slate-400 mt-1">${bet.category}</div>` : ''}
            </td>
            <td class="font-medium">${formatCurrency(bet.stake)}</td>
            <td class="capitalize font-bold ${statusClass}">${bet.status}</td>
            <td class="text-slate-300">${bet.result_notes || '—'}</td>
            <td class="text-slate-300">${bet.report_id || '—'}</td>
          </tr>
        `
      }).join('')
      flashUpdate(tbody)

    } catch (error) {
      console.warn('Failed to refresh recent results:', error)
    }
  }

  // Refresh portfolio totals
  async function refreshPortfolioTotals() {
    try {
      const response = await fetch('/api/reports')
      if (!response.ok) return

      const data = await response.json()
      const reports = data.reports || []

      // Calculate totals
      const totals = reports.reduce((acc, report) => {
        acc.totalWagered += report.total_wagered || 0
        acc.netProfit += report.net_profit || 0
        acc.totalReturn += report.total_return || 0
        return acc
      }, { totalWagered: 0, netProfit: 0, totalReturn: 0 })

      const blendedRoi = totals.totalWagered > 0
        ? (totals.netProfit / totals.totalWagered) * 100
        : 0

      // Update lifetime net
      const lifetimeNetElement = document.querySelector('[data-metric="lifetime-net"]')
      if (lifetimeNetElement) {
        lifetimeNetElement.textContent = formatCurrency(totals.netProfit)
        flashUpdate(lifetimeNetElement.closest('.rounded-2xl'))
      }

      // Update lifetime ROI
      const lifetimeRoiElement = document.querySelector('[data-metric="lifetime-roi"]')
      if (lifetimeRoiElement) {
        lifetimeRoiElement.textContent = formatPercent(blendedRoi)
        flashUpdate(lifetimeRoiElement.closest('.rounded-2xl'))
      }

      // Update total wagered
      const totalWageredElement = document.querySelector('[data-metric="total-wagered"]')
      if (totalWageredElement) {
        totalWageredElement.textContent = formatCurrency(totals.totalWagered)
        flashUpdate(totalWageredElement.closest('.rounded-2xl'))
      }

    } catch (error) {
      console.warn('Failed to refresh portfolio totals:', error)
    }
  }

  // Main refresh function
  async function refreshDashboard() {
    const now = Date.now()
    const timeSinceLastRefresh = (now - lastRefresh) / 1000

    console.log(`Refreshing dashboard data... (${timeSinceLastRefresh.toFixed(0)}s since last refresh)`)

    // Show loading indicator on live badges
    liveIndicators.forEach(indicator => {
      indicator.style.animationDuration = '0.5s'
    })

    await Promise.all([
      refreshCurrentBets(),
      refreshRecentResults(),
      refreshPortfolioTotals()
    ])

    lastRefresh = now

    // Reset animation speed
    setTimeout(() => {
      liveIndicators.forEach(indicator => {
        indicator.style.animationDuration = '2s'
      })
    }, 1000)
  }

  // Start auto-refresh every 30 seconds
  function startAutoRefresh() {
    if (refreshInterval) return

    console.log('Starting auto-refresh (30s interval)')
    refreshInterval = setInterval(refreshDashboard, 30000)

    // Do an initial refresh after 2 seconds
    setTimeout(refreshDashboard, 2000)
  }

  // Stop auto-refresh
  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
      console.log('Stopped auto-refresh')
    }
  }

  // Start auto-refresh when page is visible
  if (!document.hidden) {
    startAutoRefresh()
  }

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoRefresh()
    } else {
      startAutoRefresh()
    }
  })

  // Manual refresh on focus
  window.addEventListener('focus', () => {
    const timeSinceLastRefresh = (Date.now() - lastRefresh) / 1000
    if (timeSinceLastRefresh > 15) {
      refreshDashboard()
    }
  })
})
