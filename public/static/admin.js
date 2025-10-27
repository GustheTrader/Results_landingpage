const STORAGE_KEY = 'webapp-admin-token'

const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${value.toFixed(2)}%`
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-admin-root]')
  if (!root) return

  const betForm = root.querySelector('#bet-upload-form')
  const reportForm = root.querySelector('#report-upload-form')
  const responseNodes = root.querySelectorAll('[data-response]')
  const recentReportsContainer = root.querySelector('[data-admin-reports]')

  const savedToken = window.localStorage.getItem(STORAGE_KEY)
  if (savedToken) {
    root.querySelectorAll('input[name="adminToken"]').forEach((input) => {
      if (!input.value) input.value = savedToken
    })
  }

  const showMessage = (type, message) => {
    responseNodes.forEach((node) => {
      if (node.dataset.response === type) {
        node.textContent = message
        node.classList.remove('text-rose-400', 'text-emerald-400')
        node.classList.add(message.toLowerCase().includes('error') ? 'text-rose-400' : 'text-emerald-400')
      }
    })
  }

  const parseBets = (raw) => {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, stake, odds, eventDate, category, description] = line.split('|').map((part) => part?.trim() ?? '')
        return {
          title,
          stake: stake ? Number(stake) : null,
          odds: odds || null,
          eventDate: eventDate || null,
          category: category || null,
          description: description || null
        }
      })
  }

  const fetchWithToken = async (url, options = {}) => {
    const token = options.token
    if (!token) throw new Error('Missing admin token')
    const headers = new Headers(options.headers || {})
    headers.set('x-admin-token', token)
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal
    })
    if (!response.ok) {
      const detail = await response.text()
      throw new Error(detail || response.statusText)
    }
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }
    return response.text()
  }

  const refreshReports = async () => {
    if (!recentReportsContainer) return
    try {
      const { reports } = await fetch('/api/reports').then((res) => res.json())
      if (!reports || reports.length === 0) {
        recentReportsContainer.textContent = 'No reports ingested yet.'
        return
      }
      const topFive = reports.slice(0, 5)
      recentReportsContainer.innerHTML = topFive
        .map((report) => {
          const tone = (report.roi_percent ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'
          return `
            <article class="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <header class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-500">${formatDate(report.report_date)}</p>
                  <h3 class="mt-1 text-base font-semibold text-white">${report.label}</h3>
                </div>
                <span class="text-xs font-semibold ${tone}">${formatPercent(report.roi_percent)}</span>
              </header>
              <dl class="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                <div><p class="uppercase tracking-wide">Wagered</p><p class="mt-1 text-slate-200">${formatCurrency(report.total_wagered)}</p></div>
                <div><p class="uppercase tracking-wide">Net</p><p class="mt-1 text-slate-200">${formatCurrency(report.net_profit)}</p></div>
                <div><p class="uppercase tracking-wide">Return</p><p class="mt-1 text-slate-200">${formatCurrency(report.total_return)}</p></div>
              </dl>
            </article>
          `
        })
        .join('')
    } catch (error) {
      recentReportsContainer.textContent = `Error loading recent reports: ${error.message}`
    }
  }

  if (betForm) {
    betForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const formData = new FormData(betForm)
      const token = formData.get('adminToken')?.toString().trim()
      const rawBets = formData.get('bets')?.toString() ?? ''
      if (!token) {
        showMessage('bets', 'Error: admin token is required')
        return
      }
      const bets = parseBets(rawBets)
      if (bets.length === 0) {
        showMessage('bets', 'Error: please provide at least one bet line')
        return
      }
      betForm.querySelector('button[type="submit"]').disabled = true
      try {
        await fetchWithToken('/api/admin/bets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bets }),
          token
        })
        window.localStorage.setItem(STORAGE_KEY, token)
        showMessage('bets', `Saved ${bets.length} bet${bets.length === 1 ? '' : 's'} successfully.`)
        betForm.reset()
        if (savedToken) {
          root.querySelectorAll('input[name="adminToken"]').forEach((input) => (input.value = token))
        }
      } catch (error) {
        showMessage('bets', `Error: ${error.message}`)
      } finally {
        betForm.querySelector('button[type="submit"]').disabled = false
      }
    })
  }

  if (reportForm) {
    reportForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const formData = new FormData(reportForm)
      const token = formData.get('adminToken')?.toString().trim()
      const file = formData.get('report')
      if (!token) {
        showMessage('report', 'Error: admin token is required')
        return
      }
      if (!(file instanceof File)) {
        showMessage('report', 'Error: please attach a PDF file')
        return
      }
      const submitButton = reportForm.querySelector('button[type="submit"]')
      submitButton.disabled = true
      submitButton.textContent = 'Processing…'
      try {
        const payload = new FormData()
        payload.append('report', file)
        await fetchWithToken('/api/admin/report', {
          method: 'POST',
          body: payload,
          token
        })
        window.localStorage.setItem(STORAGE_KEY, token)
        showMessage('report', 'Report processed successfully. Metrics updated!')
        reportForm.reset()
        await refreshReports()
      } catch (error) {
        showMessage('report', `Error: ${error.message}`)
      } finally {
        submitButton.disabled = false
        submitButton.textContent = 'Process Report'
      }
    })
  }

  refreshReports()
})
