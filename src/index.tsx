import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-pages'
import { renderer } from './renderer'

export type Bindings = {
  GEMINI_API_KEY: string
  ADMIN_TOKEN: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  SUPABASE_ANON_KEY?: string
}

type ReportRow = {
  id: number
  slug: string
  label: string
  report_date: string | null
  scope: string | null
  total_wagered: number | null
  total_return: number | null
  net_profit: number | null
  roi_percent: number | null
  hit_rate: number | null
  summary: string | null
  source_pdf: string | null
  created_at: string
  updated_at: string
}

type BetRow = {
  id: number
  report_id: number | null
  title: string
  description: string | null
  stake: number | null
  odds: string | null
  decimal_odds: number | null
  event_date: string | null
  status: string
  result_notes: string | null
  category: string | null
  created_at: string
  updated_at: string
}

type AppEnv = {
  Bindings: Bindings
}

type GeminiExtractedReport = {
  label?: string
  reportDate?: string
  scope?: string
  totalWagered?: number | string | null
  totalReturn?: number | string | null
  netProfit?: number | string | null
  roiPercent?: number | string | null
  hitRate?: number | string | null
  summary?: string | null
}

type GeminiExtractedBet = {
  title?: string
  status?: string
  stake?: number | string | null
  odds?: string | null
  eventDate?: string | null
  category?: string | null
  resultNotes?: string | null
  notes?: string | null
  description?: string | null
}

type GeminiExtraction = {
  report: GeminiExtractedReport
  bets?: GeminiExtractedBet[]
  notes?: string | null
}

const MAX_PDF_BYTES = 5 * 1024 * 1024 // 5 MB ceiling per upload

const app = new Hono<AppEnv>()

app.use('/static/*', serveStatic({ root: './public' }))
app.use('/api/*', cors())

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return currencyFormatter.format(value)
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(2)}%`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').replace(/[^0-9.+\-]/g, '')
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function roundTo(value: number | null, decimals = 2): number | null {
  if (value === null) return null
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
  } else if (typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
  }
  return null
}

function convertOddsToDecimal(value: string | null | undefined): number | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/,/g, '')
  if (/^[+\-]?\d+$/.test(normalized)) {
    const american = Number(normalized)
    if (Number.isNaN(american) || american === 0) return null
    if (american > 0) {
      return Math.round(((american / 100) + 1) * 1000) / 1000
    }
    return Math.round(((100 / Math.abs(american)) + 1) * 1000) / 1000
  }
  const numeric = Number(normalized)
  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric
  }
  return null
}

function slugify(input: string): string {
  const normalized = input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (normalized) return normalized.slice(0, 120)
  return `report-${Date.now()}`
}

function normalizeTitle(input: string | null | undefined): string {
  if (!input) return ''
  return input.replace(/\s+/g, ' ').trim().toLowerCase()
}

function normalizeBetStatus(value: unknown): 'won' | 'lost' | 'push' | 'void' | null {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim().toLowerCase()
  if (!normalized) return null
  if (['won', 'win', 'w', 'hit', 'cash', 'success'].includes(normalized)) return 'won'
  if (['lost', 'loss', 'l', 'lose'].includes(normalized)) return 'lost'
  if (['push', 'tie', 'p', 't'].includes(normalized)) return 'push'
  if (['void', 'cancelled', 'canceled', 'no action', 'no-action', 'na'].includes(normalized)) return 'void'
  return null
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function stripJsonFence(input: string): string {
  return input
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()
}

function safeJsonParse<T>(input: string): T | null {
  if (!input) return null
  const cleaned = stripJsonFence(input)
  try {
    return JSON.parse(cleaned) as T
  } catch (error) {
    return null
  }
}

async function extractReportFromGemini(apiKey: string, base64Data: string, fileName: string): Promise<GeminiExtraction> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`

  const prompt = `You are an assistant that extracts structured data from weekly sports betting ROI PDF reports.
Return a JSON object with the following structure:
{
  "report": {
    "label": string,
    "reportDate": "YYYY-MM-DD" | null,
    "scope": string | null,
    "totalWagered": number,
    "totalReturn": number,
    "netProfit": number,
    "roiPercent": number,
    "hitRate": number | null,
    "summary": string | null
  },
  "bets": [
    {
      "title": string,
      "status": "won" | "lost" | "push" | "void",
      "stake": number | null,
      "odds": string | null,
      "eventDate": string | null,
      "category": string | null,
      "resultNotes": string | null
    }
  ],
  "notes": string | null
}
- Parse monetary and percentage values into numbers without currency symbols.
- reportDate must be ISO format (YYYY-MM-DD) when the document provides a clear date.
- Only include bets with a clearly identified result (won/lost/push/void).
- Use concise summaries (<= 2 sentences).
- If a field is missing in the PDF, return null for that field.
File name: ${fileName}`

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'application/pdf', data: base64Data } }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 0.8,
      responseMimeType: 'application/json'
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Gemini request failed (${response.status}): ${detail}`)
  }

  const result = (await response.json()) as Record<string, unknown>
  const candidate = (result?.candidates as Array<Record<string, unknown>> | undefined)?.[0]
  const parts = (candidate?.content as Record<string, unknown> | undefined)?.parts as Array<Record<string, unknown>> | undefined

  let payload = ''
  if (Array.isArray(parts)) {
    for (const part of parts) {
      const textPart = part?.text
      if (typeof textPart === 'string') {
        payload += textPart
      }
      const functionCall = part?.functionCall as { args?: unknown } | undefined
      if (functionCall?.args && !payload) {
        payload = JSON.stringify(functionCall.args)
      }
    }
  }

  if (!payload && typeof candidate?.content === 'object') {
    const maybeText = (candidate?.content as { text?: string }).text
    if (maybeText) {
      payload = maybeText
    }
  }

  if (!payload) {
    throw new Error('Gemini returned an empty response')
  }

  const parsed = safeJsonParse<GeminiExtraction>(payload)
  if (!parsed || !parsed.report) {
    throw new Error('Unable to parse Gemini response as structured JSON')
  }

  return parsed
}

type SupabaseRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Record<string, string | string[]>
  body?: unknown
  headers?: Record<string, string>
  prefer?: string | string[]
}

function getSupabaseConfig(env: Bindings) {
  const url = env.SUPABASE_URL?.trim()
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const anonKey = env.SUPABASE_ANON_KEY?.trim()
  if (!url) {
    throw new Error('SUPABASE_URL binding is missing')
  }
  const key = serviceKey || anonKey
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY binding is required')
  }
  return { url, key, role: serviceKey ? 'service' : 'anon' as const }
}

async function supabaseRequest<T = unknown>(env: Bindings, table: string, options: SupabaseRequestOptions = {}): Promise<T> {
  const { url: baseUrl, key } = getSupabaseConfig(env)
  const requestUrl = new URL(`/rest/v1/${table}`, baseUrl)
  if (options.query) {
    for (const [param, value] of Object.entries(options.query)) {
      if (Array.isArray(value)) {
        value.forEach((item) => requestUrl.searchParams.append(param, item))
      } else if (value !== undefined) {
        requestUrl.searchParams.append(param, value)
      }
    }
  }

  const headers = new Headers(options.headers ?? {})
  headers.set('apikey', key)
  headers.set('Authorization', `Bearer ${key}`)
  headers.set('Accept', 'application/json')
  if (options.prefer) {
    const preferValue = Array.isArray(options.prefer) ? options.prefer.join(',') : options.prefer
    headers.set('Prefer', preferValue)
  }

  let body: BodyInit | undefined
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
  }

  const response = await fetch(requestUrl.toString(), {
    method: options.method ?? 'GET',
    headers,
    body
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Supabase request failed (${response.status}): ${detail}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  const text = await response.text()
  return text as unknown as T
}

const REPORT_SELECT_FIELDS =
  'id,slug,label,report_date,scope,total_wagered,total_return,net_profit,roi_percent,hit_rate,summary,source_pdf,created_at,updated_at'

function coerceReportRow(row: Record<string, any>): ReportRow {
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ''),
    label: String(row.label ?? ''),
    report_date: row.report_date ?? null,
    scope: row.scope ?? null,
    total_wagered: roundTo(toNumber(row.total_wagered)),
    total_return: roundTo(toNumber(row.total_return)),
    net_profit: roundTo(toNumber(row.net_profit)),
    roi_percent: roundTo(toNumber(row.roi_percent)),
    hit_rate: roundTo(toNumber(row.hit_rate)),
    summary: row.summary ?? null,
    source_pdf: row.source_pdf ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString())
  }
}

const BET_SELECT_FIELDS =
  'id,report_id,title,description,stake,odds,decimal_odds,event_date,status,result_notes,category,created_at,updated_at'

function coerceBetRow(row: Record<string, any>): BetRow {
  const reportIdValue = row.report_id
  const reportId =
    reportIdValue === null || reportIdValue === undefined ? null : Number(reportIdValue)
  return {
    id: Number(row.id),
    report_id: reportId === null || Number.isNaN(reportId) ? null : reportId,
    title: String(row.title ?? ''),
    description: row.description ?? null,
    stake: roundTo(toNumber(row.stake)),
    odds: row.odds ?? null,
    decimal_odds: roundTo(toNumber(row.decimal_odds), 3),
    event_date: row.event_date ?? null,
    status: String(row.status ?? 'pending'),
    result_notes: row.result_notes ?? null,
    category: row.category ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString())
  }
}

async function getReports(env: Bindings) {
  const rows = await supabaseRequest<Record<string, unknown>[]>(env, 'reports', {
    query: {
      select: REPORT_SELECT_FIELDS,
      order: ['report_date.desc.nullslast', 'created_at.desc']
    }
  })
  if (!Array.isArray(rows)) {
    return []
  }
  return rows.map((row) => coerceReportRow(row))
}

async function queryBets(env: Bindings, params: Record<string, string | string[]> = {}) {
  const rows = await supabaseRequest<Record<string, unknown>[]>(env, 'bets', {
    query: {
      select: BET_SELECT_FIELDS,
      ...params
    }
  })
  if (!Array.isArray(rows)) {
    return []
  }
  return rows.map((row) => coerceBetRow(row))
}

async function getCurrentBets(env: Bindings) {
  return queryBets(env, {
    status: 'eq.pending',
    order: ['event_date.asc.nullslast', 'created_at.asc']
  })
}

async function getRecentResults(env: Bindings, limit = 12) {
  return queryBets(env, {
    status: 'not.eq.pending',
    order: ['updated_at.desc'],
    limit: String(limit)
  })
}

async function getAllBets(env: Bindings) {
  return queryBets(env, {
    order: ['updated_at.desc']
  })
}

async function getBetsByStatus(env: Bindings, status: string) {
  return queryBets(env, {
    status: `eq.${status}`,
    order: ['updated_at.desc']
  })
}

app.use('*', renderer)

app.get('/', async (c) => {
  const [reports, currentBets, recentBets] = await Promise.all([
    getReports(c.env),
    getCurrentBets(c.env),
    getRecentResults(c.env)
  ])

  const totals = reports.reduce(
    (acc, report) => {
      acc.totalWagered += report.total_wagered ?? 0
      acc.netProfit += report.net_profit ?? 0
      acc.totalReturn += report.total_return ?? 0
      return acc
    },
    { totalWagered: 0, netProfit: 0, totalReturn: 0 }
  )

  const blendedRoi = totals.totalWagered > 0 ? (totals.netProfit / totals.totalWagered) * 100 : 0

  return c.render(
    <HomePage
      reports={reports}
      currentBets={currentBets}
      recentBets={recentBets}
      totals={{ ...totals, blendedRoi }}
    />
  )
})

app.get('/admin', (c) => {
  return c.render(<AdminPage />)
})

app.get('/api/reports', async (c) => {
  const reports = await getReports(c.env)
  return c.json({ reports })
})

app.get('/api/bets', async (c) => {
  const status = c.req.query('status')
  let bets: BetRow[]
  if (status === 'pending') {
    bets = await getCurrentBets(c.env)
  } else if (status) {
    bets = await getBetsByStatus(c.env, status)
  } else {
    bets = await getAllBets(c.env)
  }
  return c.json({ bets })
})

app.post('/api/admin/bets', async (c) => {
  const token = c.req.header('x-admin-token')?.trim()
  if (!token || token !== c.env.ADMIN_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  let payload: { bets?: unknown }
  try {
    payload = await c.req.json<{ bets?: unknown }>()
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }

  const incoming = Array.isArray(payload?.bets) ? (payload?.bets as Array<Record<string, unknown>>) : []
  if (incoming.length === 0) {
    return c.json({ error: 'No bets supplied' }, 400)
  }

  const sanitized = incoming
    .map((bet) => {
      const title = typeof bet.title === 'string' ? bet.title.trim() : ''
      const descriptionSource =
        typeof bet.description === 'string'
          ? bet.description
          : typeof bet.notes === 'string'
          ? bet.notes
          : null
      const description = descriptionSource ? descriptionSource.trim() || null : null
      const stake = toNumber(bet.stake)
      const odds = typeof bet.odds === 'string' ? bet.odds.trim() || null : null
      const eventDate = normalizeDate((bet.eventDate as unknown) ?? (bet.date as unknown))
      const category = typeof bet.category === 'string' ? bet.category.trim() || null : null
      const decimalOdds = convertOddsToDecimal(odds)
      return {
        title,
        description,
        stake,
        odds,
        decimalOdds,
        eventDate,
        category
      }
    })
    .filter((bet) => bet.title.length > 0)

  if (sanitized.length === 0) {
    return c.json({ error: 'No valid bet rows detected' }, 400)
  }

  const existingPending = await getCurrentBets(c.env)
  const pendingLookup = existingPending.map((bet) => ({
    bet,
    normalized: normalizeTitle(bet.title)
  }))

  let created = 0
  let updated = 0

  for (const bet of sanitized) {
    const normalizedTitle = normalizeTitle(bet.title)
    const matchIndex = pendingLookup.findIndex((entry) => entry.normalized === normalizedTitle)
    const payloadData = {
      title: bet.title,
      description: bet.description,
      stake: bet.stake,
      odds: bet.odds,
      decimal_odds: bet.decimalOdds,
      event_date: bet.eventDate,
      category: bet.category,
      status: 'pending'
    }

    if (matchIndex >= 0) {
      const existing = pendingLookup.splice(matchIndex, 1)[0]
      await supabaseRequest(c.env, 'bets', {
        method: 'PATCH',
        query: { id: `eq.${existing.bet.id}` },
        body: payloadData,
        prefer: 'return=representation'
      })
      updated += 1
    } else {
      await supabaseRequest(c.env, 'bets', {
        method: 'POST',
        body: [payloadData],
        prefer: ['return=representation']
      })
      created += 1
    }
  }

  await supabaseRequest(c.env, 'uploads', {
    method: 'POST',
    body: [
      {
        type: 'current_bets',
        filename: `manual-${Date.now()}`,
        status: 'completed'
      }
    ],
    prefer: ['return=representation']
  })

  const currentBets = await getCurrentBets(c.env)

  return c.json({ created, updated, total: sanitized.length, bets: currentBets })
})

app.post('/api/admin/report', async (c) => {
  const token = c.req.header('x-admin-token')?.trim()
  if (!token || token !== c.env.ADMIN_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: 'Gemini OCR key is not configured' }, 500)
  }

  const formData = await c.req.formData()
  const file = formData.get('report')
  if (!(file instanceof File)) {
    return c.json({ error: 'Expected a PDF file under "report"' }, 400)
  }

  const fileName = file.name || `report-${Date.now()}.pdf`
  const arrayBuffer = await file.arrayBuffer()
  if (arrayBuffer.byteLength === 0) {
    return c.json({ error: 'Uploaded report is empty' }, 400)
  }
  if (arrayBuffer.byteLength > MAX_PDF_BYTES) {
    const mbLimit = (MAX_PDF_BYTES / (1024 * 1024)).toFixed(1)
    return c.json({ error: `Report exceeds ${mbLimit}MB limit` }, 400)
  }

  let uploadId: number | null = null

  try {
    const uploadRows = await supabaseRequest<Record<string, unknown>[]>(c.env, 'uploads', {
      method: 'POST',
      body: [
        {
          type: 'result_pdf',
          filename: fileName,
          status: 'processing'
        }
      ],
      prefer: ['return=representation']
    })
    if (Array.isArray(uploadRows) && uploadRows.length > 0 && uploadRows[0]?.id !== undefined) {
      uploadId = Number(uploadRows[0].id)
    }

    const base64Data = arrayBufferToBase64(arrayBuffer)
    const extraction = await extractReportFromGemini(c.env.GEMINI_API_KEY, base64Data, fileName)
    const reportInfo = extraction.report ?? {}

    const label = (reportInfo.label ?? fileName.replace(/\.pdf$/i, '')).trim()
    const slug = slugify(label)
    const reportDate = normalizeDate(reportInfo.reportDate)
    const scope = reportInfo.scope?.toString().trim() || null

    let totalWagered = roundTo(toNumber(reportInfo.totalWagered))
    let totalReturn = roundTo(toNumber(reportInfo.totalReturn))
    let netProfit = roundTo(toNumber(reportInfo.netProfit))
    let roiPercent = roundTo(toNumber(reportInfo.roiPercent))
    const hitRate = roundTo(toNumber(reportInfo.hitRate))

    if (totalWagered !== null && totalReturn !== null && netProfit === null) {
      netProfit = roundTo(totalReturn - totalWagered)
    }
    if (totalWagered !== null && netProfit !== null && totalReturn === null) {
      totalReturn = roundTo(totalWagered + netProfit)
    }
    if (totalWagered !== null && totalWagered !== 0 && netProfit !== null && roiPercent === null) {
      roiPercent = roundTo((netProfit / totalWagered) * 100)
    }

    const summary =
      reportInfo.summary?.toString().trim() || extraction.notes?.toString().trim() || null

    const reportPayload = {
      slug,
      label,
      report_date: reportDate,
      scope,
      total_wagered: totalWagered,
      total_return: totalReturn,
      net_profit: netProfit,
      roi_percent: roiPercent,
      hit_rate: hitRate,
      summary,
      source_pdf: fileName
    }

    const upsertedReports = await supabaseRequest<Record<string, unknown>[]>(c.env, 'reports', {
      method: 'POST',
      body: [reportPayload],
      prefer: ['return=representation', 'resolution=merge-duplicates']
    })

    let reportRowData: Record<string, unknown> | null = null
    if (Array.isArray(upsertedReports) && upsertedReports.length > 0) {
      reportRowData = upsertedReports[0]
    }
    if (!reportRowData) {
      const fetchedReports = await supabaseRequest<Record<string, unknown>[]>(c.env, 'reports', {
        query: {
          select: REPORT_SELECT_FIELDS,
          slug: `eq.${slug}`,
          limit: '1'
        }
      })
      if (Array.isArray(fetchedReports) && fetchedReports.length > 0) {
        reportRowData = fetchedReports[0]
      }
    }

    if (!reportRowData) {
      throw new Error('Failed to persist report data')
    }

    const reportRow = coerceReportRow(reportRowData)

    let betsUpdated = 0
    const unmatchedBets: string[] = []

    if (Array.isArray(extraction.bets) && extraction.bets.length > 0) {
      const pendingBets = await getCurrentBets(c.env)
      const pendingLookup = pendingBets.map((bet) => ({
        bet,
        normalized: normalizeTitle(bet.title)
      }))

      for (const betExtraction of extraction.bets) {
        const normalizedTitle = normalizeTitle(betExtraction.title)
        if (!normalizedTitle) {
          continue
        }

        const matchIndex = pendingLookup.findIndex((entry) => {
          if (!entry.normalized) return false
          return (
            entry.normalized === normalizedTitle ||
            entry.normalized.includes(normalizedTitle) ||
            normalizedTitle.includes(entry.normalized)
          )
        })

        if (matchIndex === -1) {
          unmatchedBets.push(betExtraction.title ?? '')
          continue
        }

        const pending = pendingLookup.splice(matchIndex, 1)[0]
        const status = normalizeBetStatus(betExtraction.status)
        if (!status) {
          unmatchedBets.push(`${betExtraction.title ?? ''} (missing status)`)
          continue
        }

        const resultNotes =
          betExtraction.resultNotes?.toString().trim() ||
          betExtraction.notes?.toString().trim() ||
          betExtraction.description?.toString().trim() ||
          null

        const stake = roundTo(toNumber(betExtraction.stake))
        const odds = typeof betExtraction.odds === 'string' ? betExtraction.odds.trim() || null : null
        const decimalOdds = convertOddsToDecimal(odds)
        const category = typeof betExtraction.category === 'string' ? betExtraction.category.trim() || null : null
        const eventDate = normalizeDate(betExtraction.eventDate)

        const updatePayload: Record<string, unknown> = {
          status,
          report_id: reportRow.id
        }

        if (resultNotes) updatePayload.result_notes = resultNotes
        if (stake !== null) updatePayload.stake = stake
        if (odds) updatePayload.odds = odds
        if (decimalOdds !== null) updatePayload.decimal_odds = decimalOdds
        if (category) updatePayload.category = category
        if (eventDate) updatePayload.event_date = eventDate

        await supabaseRequest(c.env, 'bets', {
          method: 'PATCH',
          query: { id: `eq.${pending.bet.id}` },
          body: updatePayload,
          prefer: ['return=representation']
        })

        betsUpdated += 1
      }
    }

    if (uploadId !== null) {
      await supabaseRequest(c.env, 'uploads', {
        method: 'PATCH',
        query: { id: `eq.${uploadId}` },
        body: {
          status: 'completed',
          processed_report_id: reportRow.id,
          storage_path: null,
          error: null
        },
        prefer: ['return=representation']
      })
    }

    return c.json({ report: reportRow, updatedBets: betsUpdated, unmatchedBets })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during report processing'

    if (uploadId !== null) {
      await supabaseRequest(c.env, 'uploads', {
        method: 'PATCH',
        query: { id: `eq.${uploadId}` },
        body: {
          status: 'failed',
          error: message.slice(0, 500)
        },
        prefer: ['return=representation']
      }).catch(() => {})
    }

    return c.json({ error: message }, 500)
  }
})

function HomePage({
  reports,
  currentBets,
  recentBets,
  totals
}: {
  reports: ReportRow[]
  currentBets: BetRow[]
  recentBets: BetRow[]
  totals: { totalWagered: number; totalReturn: number; netProfit: number; blendedRoi: number }
}) {
  const latestReport = reports[0]
  return (
    <div data-dashboard-root>
      <header class="bg-slate-900 border-b border-slate-800">
        <div class="mx-auto max-w-6xl px-6 py-12">
          <p class="text-sm uppercase tracking-wide text-emerald-400">ROI Performance Dashboard</p>
          <h1 class="mt-3 text-4xl font-semibold text-white md:text-5xl">NFL Edge Betting Results</h1>
          <p class="mt-4 max-w-2xl text-slate-300">
            Live view of current bets in market plus historical week-by-week ROI pulled directly from your
            uploaded PDF reports. Updated automatically whenever new picks or results land in the admin portal.
          </p>
          {latestReport ? (
            <div class="mt-8 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <dt class="text-sm font-medium text-slate-400">Most Recent Report</dt>
                  <dd class="text-xl font-semibold text-white">{latestReport.label}</dd>
                </div>
                <span class="inline-flex items-center rounded-full border border-emerald-500 px-4 py-1 text-sm font-medium text-emerald-300">
                  ROI {formatPercent(latestReport.roi_percent ?? undefined)}
                </span>
              </div>
              <dl class="grid gap-4 sm:grid-cols-3">
                <MetricCard label="Total Wagered" value={formatCurrency(latestReport.total_wagered)} />
                <MetricCard
                  label="Net Profit"
                  value={formatCurrency(latestReport.net_profit)}
                  tone={(latestReport.net_profit ?? 0) >= 0 ? 'positive' : 'negative'}
                />
                <MetricCard label="Hit Rate" value={latestReport.hit_rate ? `${latestReport.hit_rate.toFixed(1)}%` : '—'} />
              </dl>
              {latestReport.summary ? <p class="text-sm text-slate-400">{latestReport.summary}</p> : null}
            </div>
          ) : null}
        </div>
      </header>

      <main class="mx-auto max-w-6xl space-y-12 px-6 py-12">
        <section class="grid gap-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-emerald-500/10">
          <h2 class="text-2xl font-semibold text-white">Portfolio Overview</h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Active Bets" value={currentBets.length.toString()} subtle />
            <MetricCard label="Total Wagered" value={formatCurrency(totals.totalWagered)} />
            <MetricCard
              label="Lifetime Net"
              value={formatCurrency(totals.netProfit)}
              tone={totals.netProfit >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="Lifetime ROI"
              value={formatPercent(totals.blendedRoi)}
              tone={totals.blendedRoi >= 0 ? 'positive' : 'negative'}
            />
          </div>
        </section>

        <section class="grid gap-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-6" id="current-bets">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-2xl font-semibold text-white">Current Bets In Market</h2>
            <span class="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-400">Live</span>
          </div>
          {currentBets.length === 0 ? (
            <p class="text-sm text-slate-400">No open tickets right now. Upload today&apos;s picks from the admin panel to populate this list.</p>
          ) : (
            <div class="overflow-hidden rounded-xl border border-slate-800">
              <table class="min-w-full divide-y divide-slate-800 text-sm">
                <thead class="bg-slate-900/60 text-slate-400">
                  <tr>
                    <th class="px-4 py-3 text-left font-medium">Bet</th>
                    <th class="px-4 py-3 text-left font-medium">Stake</th>
                    <th class="px-4 py-3 text-left font-medium">Odds</th>
                    <th class="px-4 py-3 text-left font-medium">Event Date</th>
                    <th class="px-4 py-3 text-left font-medium">Category</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-900/60 bg-slate-950/40 text-slate-200">
                  {currentBets.map((bet) => (
                    <tr key={bet.id}>
                      <td class="px-4 py-3">
                        <div class="font-medium text-white">{bet.title}</div>
                        {bet.description ? <div class="text-xs text-slate-400">{bet.description}</div> : null}
                      </td>
                      <td class="px-4 py-3">{formatCurrency(bet.stake)}</td>
                      <td class="px-4 py-3">{bet.odds ?? '—'}</td>
                      <td class="px-4 py-3">{formatDate(bet.event_date)}</td>
                      <td class="px-4 py-3">{bet.category ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section class="grid gap-6">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-2xl font-semibold text-white">Historical ROI Reports</h2>
            <a
              href="#admin"
              class="inline-flex items-center gap-2 rounded-full border border-slate-600 px-4 py-1 text-sm text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
            >
              Manage reports
            </a>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <article key={report.id} class="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-emerald-400/60">
                <header class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-xs uppercase tracking-wide text-slate-500">{formatDate(report.report_date)}</p>
                    <h3 class="mt-2 text-lg font-semibold text-white">{report.label}</h3>
                  </div>
                  <span class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    (report.roi_percent ?? 0) >= 0 ? 'border border-emerald-500 text-emerald-300' : 'border border-rose-500 text-rose-300'
                  }`}>
                    {formatPercent(report.roi_percent ?? undefined)} ROI
                  </span>
                </header>
                {report.summary ? <p class="mt-4 text-sm leading-relaxed text-slate-300">{report.summary}</p> : null}
                <dl class="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
                  <MetricStat label="Wagered" value={formatCurrency(report.total_wagered)} />
                  <MetricStat label="Net" value={formatCurrency(report.net_profit)} />
                  <MetricStat label="Return" value={formatCurrency(report.total_return)} />
                </dl>
                {report.source_pdf ? (
                  <footer class="mt-4 text-xs text-slate-500">
                    Source: <code class="font-mono">{report.source_pdf}</code>
                  </footer>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section class="grid gap-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-6" id="recent-results">
          <h2 class="text-2xl font-semibold text-white">Recent Graded Bets</h2>
          {recentBets.length === 0 ? (
            <p class="text-sm text-slate-400">Graded results will appear here once bets are matched to an uploaded report.</p>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-800 text-sm">
                <thead class="bg-slate-900/60 text-slate-400">
                  <tr>
                    <th class="px-4 py-3 text-left font-medium">Bet</th>
                    <th class="px-4 py-3 text-left font-medium">Stake</th>
                    <th class="px-4 py-3 text-left font-medium">Result</th>
                    <th class="px-4 py-3 text-left font-medium">Notes</th>
                    <th class="px-4 py-3 text-left font-medium">Report</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-900/60 bg-slate-950/40 text-slate-200">
                  {recentBets.map((bet) => (
                    <tr key={bet.id}>
                      <td class="px-4 py-3">
                        <div class="font-medium text-white">{bet.title}</div>
                        {bet.category ? <div class="text-xs text-slate-400">{bet.category}</div> : null}
                      </td>
                      <td class="px-4 py-3">{formatCurrency(bet.stake)}</td>
                      <td class={`px-4 py-3.capitalize ${
                        bet.status === 'won'
                          ? 'text-emerald-300'
                          : bet.status === 'lost'
                          ? 'text-rose-300'
                          : bet.status === 'push'
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }`}>
                        {bet.status}
                      </td>
                      <td class="px-4 py-3 text-slate-400">{bet.result_notes ?? '—'}</td>
                      <td class="px-4 py-3 text-slate-400">{bet.report_id ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer class="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        Built for rapid ROI tracking — upload new data from the admin console to refresh live metrics instantly.
      </footer>
    </div>
  )
}

function MetricCard({
  label,
  value,
  tone = 'neutral',
  subtle
}: {
  label: string
  value: string
  tone?: 'positive' | 'negative' | 'neutral'
  subtle?: boolean
}) {
  const containerTone =
    tone === 'positive'
      ? 'border-emerald-500/40 bg-emerald-500/5'
      : tone === 'negative'
      ? 'border-rose-500/40 bg-rose-500/5'
      : 'border-slate-800 bg-slate-900/40'
  const valueTone =
    tone === 'positive' ? 'text-emerald-300' : tone === 'negative' ? 'text-rose-300' : 'text-white'
  return (
    <div class={`rounded-xl border ${containerTone} p-4`}>
      <p class={`text-xs uppercase tracking-wide ${subtle ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p class={`mt-2 text-xl font-semibold ${valueTone}`}>{value}</p>
    </div>
  )
}

function MetricStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p class="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p class="mt-1 font-medium text-slate-200">{value}</p>
    </div>
  )
}

function AdminPage() {
  return (
    <div data-admin-root class="min-h-screen bg-slate-950">
      <div class="mx-auto max-w-5xl px-6 py-12 text-white">
        <header class="mb-10">
          <p class="text-sm uppercase tracking-wide text-emerald-400">Admin Console</p>
          <h1 class="mt-3 text-4xl font-semibold">Manage Bets & ROI Reports</h1>
          <p class="mt-4 max-w-2xl text-slate-300">
            Upload daily picks, ingest ROI PDFs via Gemini OCR, and reconcile results with existing tickets. Provide the
            admin token with each action to authorize updates.
          </p>
        </header>

        <div class="grid gap-10">
          <section class="rounded-2xl border border-slate-800 bg-slate-900/70 p-6" id="admin">
            <h2 class="text-xl font-semibold">1. Add Current Bets</h2>
            <p class="mt-2 text-sm text-slate-300">
              Paste today&apos;s plays below. Each line should include title, stake, odds, event date (optional), category, and
              description separated by pipes.| Example: <code class="font-mono">Texans -3 | 150 | -110 | 2025-09-18 | Spread | AFC South opener</code>
            </p>
            <form id="bet-upload-form" class="mt-4 space-y-4">
              <textarea
                name="bets"
                rows={6}
                class="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 font-mono text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                placeholder="Bet title | stake | odds | date | category | description"
              ></textarea>
              <div class="flex flex-wrap items-center gap-3">
                <input
                  name="adminToken"
                  type="password"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none md:w-64"
                  placeholder="Admin token"
                  required
                />
                <button
                  type="submit"
                  class="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
                >
                  Save Bets
                </button>
                <p class="text-xs text-slate-400">Bets appear immediately on the public page once saved.</p>
              </div>
              <p class="text-xs text-emerald-400" data-response="bets"></p>
            </form>
          </section>

          <section class="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 class="text-xl font-semibold">2. Upload ROI PDF</h2>
            <p class="mt-2 text-sm text-slate-300">
              Drop the weekly ROI PDF exported from your research deck. Gemini OCR parses totals & individual results, then
              matches them to open bets automatically. PDF uploads stay private within your worker storage.
            </p>
            <form id="report-upload-form" class="mt-4 space-y-4">
              <input
                type="file"
                name="report"
                accept="application/pdf"
                class="block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                required
              />
              <div class="flex flex-wrap items-center gap-3">
                <input
                  name="adminToken"
                  type="password"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none md:w-64"
                  placeholder="Admin token"
                  required
                />
                <button
                  type="submit"
                  class="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
                >
                  Process Report
                </button>
              </div>
              <p class="text-xs text-emerald-400" data-response="report"></p>
            </form>
          </section>

          <section class="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 class="text-xl font-semibold">3. Recent Uploads</h2>
            <p class="mt-2 text-sm text-slate-300">
              Quick glance at the latest graded reports and their ROI metrics. Refreshes automatically after each
              successful upload.
            </p>
            <div
              data-admin-reports
              class="mt-4 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300"
            >
              Loading recent reports…
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default app
