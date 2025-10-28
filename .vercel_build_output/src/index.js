import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { renderer } from './renderer';
const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB ceiling per upload
const app = new Hono();
// Static files are served by Vercel automatically from /public
// For Cloudflare deployment, uncomment: app.use('/static/*', serveStatic({ root: './public' }))
app.use('/api/*', cors());
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
});
function formatCurrency(value) {
    if (value === null || value === undefined)
        return '—';
    return currencyFormatter.format(value);
}
function formatPercent(value) {
    if (value === null || value === undefined)
        return '—';
    return `${value.toFixed(2)}%`;
}
function formatDate(value) {
    if (!value)
        return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
function toNumber(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'number') {
        return Number.isNaN(value) ? null : value;
    }
    if (typeof value === 'string') {
        const cleaned = value.replace(/,/g, '').replace(/[^0-9.+\-]/g, '');
        if (!cleaned)
            return null;
        const parsed = Number(cleaned);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}
function roundTo(value, decimals = 2) {
    if (value === null)
        return null;
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function normalizeDate(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed)
            return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString().slice(0, 10);
        }
    }
    else if (typeof value === 'number') {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString().slice(0, 10);
        }
    }
    return null;
}
function convertOddsToDecimal(value) {
    if (!value)
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    const normalized = trimmed.replace(/,/g, '');
    if (/^[+\-]?\d+$/.test(normalized)) {
        const american = Number(normalized);
        if (Number.isNaN(american) || american === 0)
            return null;
        if (american > 0) {
            return Math.round(((american / 100) + 1) * 1000) / 1000;
        }
        return Math.round(((100 / Math.abs(american)) + 1) * 1000) / 1000;
    }
    const numeric = Number(normalized);
    if (!Number.isNaN(numeric) && numeric > 0) {
        return numeric;
    }
    return null;
}
function slugify(input) {
    const normalized = input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (normalized)
        return normalized.slice(0, 120);
    return `report-${Date.now()}`;
}
function normalizeTitle(input) {
    if (!input)
        return '';
    return input.replace(/\s+/g, ' ').trim().toLowerCase();
}
function normalizeBetStatus(value) {
    if (value === null || value === undefined)
        return null;
    const normalized = String(value).trim().toLowerCase();
    if (!normalized)
        return null;
    if (['won', 'win', 'w', 'hit', 'cash', 'success'].includes(normalized))
        return 'won';
    if (['lost', 'loss', 'l', 'lose'].includes(normalized))
        return 'lost';
    if (['push', 'tie', 'p', 't'].includes(normalized))
        return 'push';
    if (['void', 'cancelled', 'canceled', 'no action', 'no-action', 'na'].includes(normalized))
        return 'void';
    return null;
}
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}
function stripJsonFence(input) {
    return input
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
}
function safeJsonParse(input) {
    if (!input)
        return null;
    const cleaned = stripJsonFence(input);
    try {
        return JSON.parse(cleaned);
    }
    catch (error) {
        return null;
    }
}
async function extractReportFromGemini(apiKey, base64Data, fileName) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
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
File name: ${fileName}`;
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
    };
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Gemini request failed (${response.status}): ${detail}`);
    }
    const result = (await response.json());
    const candidate = result?.candidates?.[0];
    const parts = candidate?.content?.parts;
    let payload = '';
    if (Array.isArray(parts)) {
        for (const part of parts) {
            const textPart = part?.text;
            if (typeof textPart === 'string') {
                payload += textPart;
            }
            const functionCall = part?.functionCall;
            if (functionCall?.args && !payload) {
                payload = JSON.stringify(functionCall.args);
            }
        }
    }
    if (!payload && typeof candidate?.content === 'object') {
        const maybeText = (candidate?.content).text;
        if (maybeText) {
            payload = maybeText;
        }
    }
    if (!payload) {
        throw new Error('Gemini returned an empty response');
    }
    const parsed = safeJsonParse(payload);
    if (!parsed || !parsed.report) {
        throw new Error('Unable to parse Gemini response as structured JSON');
    }
    return parsed;
}
function getSupabaseConfig(env) {
    const url = env.SUPABASE_URL?.trim();
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const anonKey = env.SUPABASE_ANON_KEY?.trim();
    if (!url) {
        throw new Error('SUPABASE_URL binding is missing');
    }
    const key = serviceKey || anonKey;
    if (!key) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY binding is required');
    }
    return { url, key, role: serviceKey ? 'service' : 'anon' };
}
async function supabaseRequest(env, table, options = {}) {
    const { url: baseUrl, key } = getSupabaseConfig(env);
    const requestUrl = new URL(`/rest/v1/${table}`, baseUrl);
    if (options.query) {
        for (const [param, value] of Object.entries(options.query)) {
            if (Array.isArray(value)) {
                value.forEach((item) => requestUrl.searchParams.append(param, item));
            }
            else if (value !== undefined) {
                requestUrl.searchParams.append(param, value);
            }
        }
    }
    const headers = new Headers(options.headers ?? {});
    headers.set('apikey', key);
    headers.set('Authorization', `Bearer ${key}`);
    headers.set('Accept', 'application/json');
    if (options.prefer) {
        const preferValue = Array.isArray(options.prefer) ? options.prefer.join(',') : options.prefer;
        headers.set('Prefer', preferValue);
    }
    let body;
    if (options.body !== undefined) {
        headers.set('Content-Type', 'application/json');
        body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    const response = await fetch(requestUrl.toString(), {
        method: options.method ?? 'GET',
        headers,
        body
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Supabase request failed (${response.status}): ${detail}`);
    }
    if (response.status === 204) {
        return undefined;
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        return (await response.json());
    }
    const text = await response.text();
    return text;
}
const REPORT_SELECT_FIELDS = 'id,slug,label,report_date,scope,total_wagered,total_return,net_profit,roi_percent,hit_rate,summary,source_pdf,created_at,updated_at';
function coerceReportRow(row) {
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
    };
}
const BET_SELECT_FIELDS = 'id,report_id,title,description,stake,odds,decimal_odds,event_date,status,result_notes,category,created_at,updated_at';
function coerceBetRow(row) {
    const reportIdValue = row.report_id;
    const reportId = reportIdValue === null || reportIdValue === undefined ? null : Number(reportIdValue);
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
    };
}
async function getReports(env) {
    const rows = await supabaseRequest(env, 'reports', {
        query: {
            select: REPORT_SELECT_FIELDS,
            order: ['report_date.desc.nullslast', 'created_at.desc']
        }
    });
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.map((row) => coerceReportRow(row));
}
async function queryBets(env, params = {}) {
    const rows = await supabaseRequest(env, 'bets', {
        query: {
            select: BET_SELECT_FIELDS,
            ...params
        }
    });
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.map((row) => coerceBetRow(row));
}
async function getCurrentBets(env) {
    return queryBets(env, {
        status: 'eq.pending',
        order: ['event_date.asc.nullslast', 'created_at.asc']
    });
}
async function getRecentResults(env, limit = 12) {
    return queryBets(env, {
        status: 'not.eq.pending',
        order: ['updated_at.desc'],
        limit: String(limit)
    });
}
async function getAllBets(env) {
    return queryBets(env, {
        order: ['updated_at.desc']
    });
}
async function getBetsByStatus(env, status) {
    return queryBets(env, {
        status: `eq.${status}`,
        order: ['updated_at.desc']
    });
}
app.use('*', renderer);
app.get('/', async (c) => {
    const [reports, currentBets, recentBets] = await Promise.all([
        getReports(c.env),
        getCurrentBets(c.env),
        getRecentResults(c.env)
    ]);
    const totals = reports.reduce((acc, report) => {
        acc.totalWagered += report.total_wagered ?? 0;
        acc.netProfit += report.net_profit ?? 0;
        acc.totalReturn += report.total_return ?? 0;
        return acc;
    }, { totalWagered: 0, netProfit: 0, totalReturn: 0 });
    const blendedRoi = totals.totalWagered > 0 ? (totals.netProfit / totals.totalWagered) * 100 : 0;
    return c.render(_jsx(HomePage, { reports: reports, currentBets: currentBets, recentBets: recentBets, totals: { ...totals, blendedRoi } }));
});
app.get('/admin', (c) => {
    return c.render(_jsx(AdminPage, {}));
});
app.get('/api/reports', async (c) => {
    const reports = await getReports(c.env);
    return c.json({ reports });
});
app.get('/api/bets', async (c) => {
    const status = c.req.query('status');
    let bets;
    if (status === 'pending') {
        bets = await getCurrentBets(c.env);
    }
    else if (status) {
        bets = await getBetsByStatus(c.env, status);
    }
    else {
        bets = await getAllBets(c.env);
    }
    return c.json({ bets });
});
app.post('/api/admin/bets', async (c) => {
    const token = c.req.header('x-admin-token')?.trim();
    if (!token || token !== c.env.ADMIN_TOKEN) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    let payload;
    try {
        payload = await c.req.json();
    }
    catch (error) {
        return c.json({ error: 'Invalid JSON payload' }, 400);
    }
    const incoming = Array.isArray(payload?.bets) ? payload?.bets : [];
    if (incoming.length === 0) {
        return c.json({ error: 'No bets supplied' }, 400);
    }
    const sanitized = incoming
        .map((bet) => {
        const title = typeof bet.title === 'string' ? bet.title.trim() : '';
        const descriptionSource = typeof bet.description === 'string'
            ? bet.description
            : typeof bet.notes === 'string'
                ? bet.notes
                : null;
        const description = descriptionSource ? descriptionSource.trim() || null : null;
        const stake = toNumber(bet.stake);
        const odds = typeof bet.odds === 'string' ? bet.odds.trim() || null : null;
        const eventDate = normalizeDate(bet.eventDate ?? bet.date);
        const category = typeof bet.category === 'string' ? bet.category.trim() || null : null;
        const decimalOdds = convertOddsToDecimal(odds);
        return {
            title,
            description,
            stake,
            odds,
            decimalOdds,
            eventDate,
            category
        };
    })
        .filter((bet) => bet.title.length > 0);
    if (sanitized.length === 0) {
        return c.json({ error: 'No valid bet rows detected' }, 400);
    }
    const existingPending = await getCurrentBets(c.env);
    const pendingLookup = existingPending.map((bet) => ({
        bet,
        normalized: normalizeTitle(bet.title)
    }));
    let created = 0;
    let updated = 0;
    for (const bet of sanitized) {
        const normalizedTitle = normalizeTitle(bet.title);
        const matchIndex = pendingLookup.findIndex((entry) => entry.normalized === normalizedTitle);
        const payloadData = {
            title: bet.title,
            description: bet.description,
            stake: bet.stake,
            odds: bet.odds,
            decimal_odds: bet.decimalOdds,
            event_date: bet.eventDate,
            category: bet.category,
            status: 'pending'
        };
        if (matchIndex >= 0) {
            const existing = pendingLookup.splice(matchIndex, 1)[0];
            await supabaseRequest(c.env, 'bets', {
                method: 'PATCH',
                query: { id: `eq.${existing.bet.id}` },
                body: payloadData,
                prefer: 'return=representation'
            });
            updated += 1;
        }
        else {
            await supabaseRequest(c.env, 'bets', {
                method: 'POST',
                body: [payloadData],
                prefer: ['return=representation']
            });
            created += 1;
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
    });
    const currentBets = await getCurrentBets(c.env);
    return c.json({ created, updated, total: sanitized.length, bets: currentBets });
});
app.post('/api/admin/report', async (c) => {
    const token = c.req.header('x-admin-token')?.trim();
    if (!token || token !== c.env.ADMIN_TOKEN) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    if (!c.env.GEMINI_API_KEY) {
        return c.json({ error: 'Gemini OCR key is not configured' }, 500);
    }
    const formData = await c.req.formData();
    const file = formData.get('report');
    if (!(file instanceof File)) {
        return c.json({ error: 'Expected a PDF file under "report"' }, 400);
    }
    const fileName = file.name || `report-${Date.now()}.pdf`;
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
        return c.json({ error: 'Uploaded report is empty' }, 400);
    }
    if (arrayBuffer.byteLength > MAX_PDF_BYTES) {
        const mbLimit = (MAX_PDF_BYTES / (1024 * 1024)).toFixed(1);
        return c.json({ error: `Report exceeds ${mbLimit}MB limit` }, 400);
    }
    let uploadId = null;
    try {
        const uploadRows = await supabaseRequest(c.env, 'uploads', {
            method: 'POST',
            body: [
                {
                    type: 'result_pdf',
                    filename: fileName,
                    status: 'processing'
                }
            ],
            prefer: ['return=representation']
        });
        if (Array.isArray(uploadRows) && uploadRows.length > 0 && uploadRows[0]?.id !== undefined) {
            uploadId = Number(uploadRows[0].id);
        }
        const base64Data = arrayBufferToBase64(arrayBuffer);
        const extraction = await extractReportFromGemini(c.env.GEMINI_API_KEY, base64Data, fileName);
        const reportInfo = extraction.report ?? {};
        const label = (reportInfo.label ?? fileName.replace(/\.pdf$/i, '')).trim();
        const slug = slugify(label);
        const reportDate = normalizeDate(reportInfo.reportDate);
        const scope = reportInfo.scope?.toString().trim() || null;
        let totalWagered = roundTo(toNumber(reportInfo.totalWagered));
        let totalReturn = roundTo(toNumber(reportInfo.totalReturn));
        let netProfit = roundTo(toNumber(reportInfo.netProfit));
        let roiPercent = roundTo(toNumber(reportInfo.roiPercent));
        const hitRate = roundTo(toNumber(reportInfo.hitRate));
        if (totalWagered !== null && totalReturn !== null && netProfit === null) {
            netProfit = roundTo(totalReturn - totalWagered);
        }
        if (totalWagered !== null && netProfit !== null && totalReturn === null) {
            totalReturn = roundTo(totalWagered + netProfit);
        }
        if (totalWagered !== null && totalWagered !== 0 && netProfit !== null && roiPercent === null) {
            roiPercent = roundTo((netProfit / totalWagered) * 100);
        }
        const summary = reportInfo.summary?.toString().trim() || extraction.notes?.toString().trim() || null;
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
        };
        const upsertedReports = await supabaseRequest(c.env, 'reports', {
            method: 'POST',
            body: [reportPayload],
            prefer: ['return=representation', 'resolution=merge-duplicates']
        });
        let reportRowData = null;
        if (Array.isArray(upsertedReports) && upsertedReports.length > 0) {
            reportRowData = upsertedReports[0];
        }
        if (!reportRowData) {
            const fetchedReports = await supabaseRequest(c.env, 'reports', {
                query: {
                    select: REPORT_SELECT_FIELDS,
                    slug: `eq.${slug}`,
                    limit: '1'
                }
            });
            if (Array.isArray(fetchedReports) && fetchedReports.length > 0) {
                reportRowData = fetchedReports[0];
            }
        }
        if (!reportRowData) {
            throw new Error('Failed to persist report data');
        }
        const reportRow = coerceReportRow(reportRowData);
        let betsUpdated = 0;
        const unmatchedBets = [];
        if (Array.isArray(extraction.bets) && extraction.bets.length > 0) {
            const pendingBets = await getCurrentBets(c.env);
            const pendingLookup = pendingBets.map((bet) => ({
                bet,
                normalized: normalizeTitle(bet.title)
            }));
            for (const betExtraction of extraction.bets) {
                const normalizedTitle = normalizeTitle(betExtraction.title);
                if (!normalizedTitle) {
                    continue;
                }
                const matchIndex = pendingLookup.findIndex((entry) => {
                    if (!entry.normalized)
                        return false;
                    return (entry.normalized === normalizedTitle ||
                        entry.normalized.includes(normalizedTitle) ||
                        normalizedTitle.includes(entry.normalized));
                });
                if (matchIndex === -1) {
                    unmatchedBets.push(betExtraction.title ?? '');
                    continue;
                }
                const pending = pendingLookup.splice(matchIndex, 1)[0];
                const status = normalizeBetStatus(betExtraction.status);
                if (!status) {
                    unmatchedBets.push(`${betExtraction.title ?? ''} (missing status)`);
                    continue;
                }
                const resultNotes = betExtraction.resultNotes?.toString().trim() ||
                    betExtraction.notes?.toString().trim() ||
                    betExtraction.description?.toString().trim() ||
                    null;
                const stake = roundTo(toNumber(betExtraction.stake));
                const odds = typeof betExtraction.odds === 'string' ? betExtraction.odds.trim() || null : null;
                const decimalOdds = convertOddsToDecimal(odds);
                const category = typeof betExtraction.category === 'string' ? betExtraction.category.trim() || null : null;
                const eventDate = normalizeDate(betExtraction.eventDate);
                const updatePayload = {
                    status,
                    report_id: reportRow.id
                };
                if (resultNotes)
                    updatePayload.result_notes = resultNotes;
                if (stake !== null)
                    updatePayload.stake = stake;
                if (odds)
                    updatePayload.odds = odds;
                if (decimalOdds !== null)
                    updatePayload.decimal_odds = decimalOdds;
                if (category)
                    updatePayload.category = category;
                if (eventDate)
                    updatePayload.event_date = eventDate;
                await supabaseRequest(c.env, 'bets', {
                    method: 'PATCH',
                    query: { id: `eq.${pending.bet.id}` },
                    body: updatePayload,
                    prefer: ['return=representation']
                });
                betsUpdated += 1;
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
            });
        }
        return c.json({ report: reportRow, updatedBets: betsUpdated, unmatchedBets });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error during report processing';
        if (uploadId !== null) {
            await supabaseRequest(c.env, 'uploads', {
                method: 'PATCH',
                query: { id: `eq.${uploadId}` },
                body: {
                    status: 'failed',
                    error: message.slice(0, 500)
                },
                prefer: ['return=representation']
            }).catch(() => { });
        }
        return c.json({ error: message }, 500);
    }
});
function HomePage({ reports, currentBets, recentBets, totals }) {
    const latestReport = reports[0];
    return (_jsxs("div", { "data-dashboard-root": true, style: "position: relative; z-index: 1;", children: [_jsx("header", { class: "relative border-b border-slate-700/50", children: _jsxs("div", { class: "mx-auto max-w-6xl px-6 py-16", children: [_jsxs("div", { class: "reveal", children: [_jsx("div", { class: "inline-block", children: _jsx("p", { class: "text-sm uppercase tracking-widest font-semibold gradient-accent bg-clip-text text-transparent", children: "ROI Performance Dashboard" }) }), _jsx("h1", { class: "mt-4 text-5xl font-bold text-white md:text-6xl lg:text-7xl bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent", children: "NFL Edge Betting Results" }), _jsx("p", { class: "mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed", children: "Live view of current bets in market plus historical week-by-week ROI pulled directly from your uploaded PDF reports. Updated automatically whenever new picks or results land in the admin portal." })] }), latestReport ? (_jsxs("div", { class: "mt-10 glass-card rounded-3xl p-8 reveal metric-glow", children: [_jsxs("div", { class: "flex flex-wrap items-center justify-between gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("dt", { class: "text-sm font-medium uppercase tracking-wide text-slate-400", children: "Most Recent Report" }), _jsx("dd", { class: "text-2xl font-bold text-white mt-2", children: latestReport.label })] }), _jsxs("span", { class: "inline-flex items-center rounded-full gradient-accent px-6 py-2 text-sm font-bold text-white shadow-lg shadow-purple-500/30", children: ["ROI ", formatPercent(latestReport.roi_percent ?? undefined)] })] }), _jsxs("dl", { class: "grid gap-4 sm:grid-cols-3", children: [_jsx(MetricCard, { label: "Total Wagered", value: formatCurrency(latestReport.total_wagered) }), _jsx(MetricCard, { label: "Net Profit", value: formatCurrency(latestReport.net_profit), tone: (latestReport.net_profit ?? 0) >= 0 ? 'positive' : 'negative' }), _jsx(MetricCard, { label: "Hit Rate", value: latestReport.hit_rate ? `${latestReport.hit_rate.toFixed(1)}%` : '—' })] }), latestReport.summary ? _jsx("p", { class: "mt-4 text-sm text-slate-300 leading-relaxed", children: latestReport.summary }) : null] })) : null] }) }), _jsxs("main", { class: "mx-auto max-w-6xl space-y-12 px-6 py-12", children: [_jsxs("section", { class: "glass-card rounded-3xl p-8 reveal", children: [_jsx("h2", { class: "text-3xl font-bold text-white mb-8 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent", children: "Portfolio Overview" }), _jsxs("div", { class: "grid gap-6 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(MetricCard, { label: "Active Bets", value: currentBets.length.toString(), subtle: true }), _jsx(MetricCard, { label: "Total Wagered", value: formatCurrency(totals.totalWagered) }), _jsx(MetricCard, { label: "Lifetime Net", value: formatCurrency(totals.netProfit), tone: totals.netProfit >= 0 ? 'positive' : 'negative' }), _jsx(MetricCard, { label: "Lifetime ROI", value: formatPercent(totals.blendedRoi), tone: totals.blendedRoi >= 0 ? 'positive' : 'negative' })] })] }), _jsxs("section", { class: "glass-card rounded-3xl p-8 reveal", id: "current-bets", children: [_jsxs("div", { class: "flex items-center justify-between gap-4 mb-6", children: [_jsx("h2", { class: "text-3xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent", children: "Current Bets In Market" }), _jsx("span", { class: "rounded-full gradient-accent px-4 py-2 text-xs uppercase tracking-wider font-bold text-white shadow-lg shadow-green-500/20 animate-pulse", children: "Live" })] }), currentBets.length === 0 ? (_jsx("p", { class: "text-base text-slate-300", children: "No open tickets right now. Upload today's picks from the admin panel to populate this list." })) : (_jsx("div", { class: "overflow-hidden rounded-2xl", children: _jsxs("table", { class: "min-w-full text-sm", children: [_jsx("thead", { class: "text-slate-300", children: _jsxs("tr", { children: [_jsx("th", { class: "text-left", children: "Bet" }), _jsx("th", { class: "text-left", children: "Stake" }), _jsx("th", { class: "text-left", children: "Odds" }), _jsx("th", { class: "text-left", children: "Event Date" }), _jsx("th", { class: "text-left", children: "Category" })] }) }), _jsx("tbody", { class: "text-slate-200", children: currentBets.map((bet) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { class: "font-semibold text-white", children: bet.title }), bet.description ? _jsx("div", { class: "text-xs text-slate-400 mt-1", children: bet.description }) : null] }), _jsx("td", { class: "font-medium", children: formatCurrency(bet.stake) }), _jsx("td", { class: "text-blue-300 font-medium", children: bet.odds ?? '—' }), _jsx("td", { class: "text-slate-300", children: formatDate(bet.event_date) }), _jsx("td", { class: "text-slate-300", children: bet.category ?? '—' })] }, bet.id))) })] }) }))] }), _jsxs("section", { class: "grid gap-8 reveal", children: [_jsxs("div", { class: "flex items-center justify-between gap-4", children: [_jsx("h2", { class: "text-3xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent", children: "Historical ROI Reports" }), _jsx("a", { href: "#admin", class: "button inline-flex items-center gap-2 rounded-full glass-card px-6 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all", children: "Manage reports" })] }), _jsx("div", { class: "grid gap-6 md:grid-cols-2", children: reports.map((report) => (_jsxs("article", { class: "glass-card rounded-3xl p-6 metric-glow", children: [_jsxs("header", { class: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { class: "text-xs uppercase tracking-wider text-slate-400 font-semibold", children: formatDate(report.report_date) }), _jsx("h3", { class: "mt-3 text-xl font-bold text-white", children: report.label })] }), _jsxs("span", { class: `inline-flex items-center rounded-full px-4 py-2 text-xs font-bold shadow-lg ${(report.roi_percent ?? 0) >= 0
                                                        ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-emerald-500/30'
                                                        : 'bg-gradient-to-r from-rose-500 to-red-400 text-white shadow-rose-500/30'}`, children: [formatPercent(report.roi_percent ?? undefined), " ROI"] })] }), report.summary ? _jsx("p", { class: "mt-4 text-sm leading-relaxed text-slate-300", children: report.summary }) : null, _jsxs("dl", { class: "mt-5 grid gap-4 text-sm sm:grid-cols-3", children: [_jsx(MetricStat, { label: "Wagered", value: formatCurrency(report.total_wagered) }), _jsx(MetricStat, { label: "Net", value: formatCurrency(report.net_profit) }), _jsx(MetricStat, { label: "Return", value: formatCurrency(report.total_return) })] }), report.source_pdf ? (_jsxs("footer", { class: "mt-4 text-xs text-slate-500", children: ["Source: ", _jsx("code", { class: "font-mono hover:text-purple-400 transition-colors", children: report.source_pdf })] })) : null] }, report.id))) })] }), _jsxs("section", { class: "glass-card rounded-3xl p-8 reveal", id: "recent-results", children: [_jsx("h2", { class: "text-3xl font-bold text-white mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent", children: "Recent Graded Bets" }), recentBets.length === 0 ? (_jsx("p", { class: "text-base text-slate-300", children: "Graded results will appear here once bets are matched to an uploaded report." })) : (_jsx("div", { class: "overflow-x-auto rounded-2xl", children: _jsxs("table", { class: "min-w-full text-sm", children: [_jsx("thead", { class: "text-slate-300", children: _jsxs("tr", { children: [_jsx("th", { class: "text-left", children: "Bet" }), _jsx("th", { class: "text-left", children: "Stake" }), _jsx("th", { class: "text-left", children: "Result" }), _jsx("th", { class: "text-left", children: "Notes" }), _jsx("th", { class: "text-left", children: "Report" })] }) }), _jsx("tbody", { class: "text-slate-200", children: recentBets.map((bet) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { class: "font-semibold text-white", children: bet.title }), bet.category ? _jsx("div", { class: "text-xs text-slate-400 mt-1", children: bet.category }) : null] }), _jsx("td", { class: "font-medium", children: formatCurrency(bet.stake) }), _jsx("td", { class: `capitalize font-bold ${bet.status === 'won'
                                                            ? 'text-emerald-400'
                                                            : bet.status === 'lost'
                                                                ? 'text-rose-400'
                                                                : bet.status === 'push'
                                                                    ? 'text-amber-400'
                                                                    : 'text-slate-300'}`, children: bet.status }), _jsx("td", { class: "text-slate-300", children: bet.result_notes ?? '—' }), _jsx("td", { class: "text-slate-300", children: bet.report_id ?? '—' })] }, bet.id))) })] }) }))] })] }), _jsxs("footer", { class: "relative border-t border-slate-700/50 glass-card py-8 text-center", children: [_jsx("p", { class: "text-sm text-slate-400", children: "Built for rapid ROI tracking \u2014 upload new data from the admin console to refresh live metrics instantly." }), _jsxs("div", { class: "mt-3 flex items-center justify-center gap-2", children: [_jsx("div", { class: "h-2 w-2 rounded-full bg-emerald-400 animate-pulse" }), _jsx("span", { class: "text-xs text-slate-500", children: "Live Dashboard" })] })] })] }));
}
function MetricCard({ label, value, tone = 'neutral', subtle }) {
    const containerTone = tone === 'positive'
        ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-green-500/5'
        : tone === 'negative'
            ? 'border-rose-400/30 bg-gradient-to-br from-rose-500/10 to-red-500/5'
            : 'border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/20';
    const valueTone = tone === 'positive' ? 'text-emerald-300' : tone === 'negative' ? 'text-rose-300' : 'text-white';
    const glowClass = tone !== 'neutral' ? 'metric-glow' : '';
    return (_jsxs("div", { class: `rounded-2xl border backdrop-blur-sm ${containerTone} ${glowClass} p-6 transition-all hover:scale-105`, children: [_jsx("p", { class: `text-xs uppercase tracking-wider font-semibold ${subtle ? 'text-slate-400' : 'text-slate-400'}`, children: label }), _jsx("p", { class: `mt-3 text-2xl font-bold ${valueTone}`, children: value })] }));
}
function MetricStat({ label, value }) {
    return (_jsxs("div", { class: "text-center", children: [_jsx("p", { class: "text-xs uppercase tracking-wider text-slate-400 font-semibold", children: label }), _jsx("p", { class: "mt-2 font-bold text-white text-base", children: value })] }));
}
function AdminPage() {
    return (_jsx("div", { "data-admin-root": true, class: "min-h-screen", style: "position: relative; z-index: 1;", children: _jsxs("div", { class: "mx-auto max-w-5xl px-6 py-12 text-white", children: [_jsxs("header", { class: "mb-12 reveal", children: [_jsx("div", { class: "inline-block", children: _jsx("p", { class: "text-sm uppercase tracking-widest font-semibold gradient-accent bg-clip-text text-transparent", children: "Admin Console" }) }), _jsx("h1", { class: "mt-4 text-5xl font-bold bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent", children: "Manage Bets & ROI Reports" }), _jsx("p", { class: "mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed", children: "Upload daily picks, ingest ROI PDFs via Gemini OCR, and reconcile results with existing tickets. Provide the admin token with each action to authorize updates." })] }), _jsxs("div", { class: "grid gap-10", children: [_jsxs("section", { class: "glass-card rounded-3xl p-8 reveal", id: "admin", children: [_jsx("h2", { class: "text-2xl font-bold text-white mb-3", children: "1. Add Current Bets" }), _jsxs("p", { class: "mt-2 text-sm text-slate-300 leading-relaxed", children: ["Paste today's plays below. Each line should include title, stake, odds, event date (optional), category, and description separated by pipes. Example: ", _jsx("code", { class: "font-mono text-purple-300 bg-slate-800/50 px-2 py-1 rounded", children: "Texans -3 | 150 | -110 | 2025-09-18 | Spread | AFC South opener" })] }), _jsxs("form", { id: "bet-upload-form", class: "mt-6 space-y-5", children: [_jsx("textarea", { name: "bets", rows: 6, class: "w-full rounded-2xl border border-slate-600/50 bg-slate-900/60 backdrop-blur-sm p-4 font-mono text-sm text-slate-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all", placeholder: "Bet title | stake | odds | date | category | description" }), _jsxs("div", { class: "flex flex-wrap items-center gap-4", children: [_jsx("input", { name: "adminToken", type: "password", class: "flex-1 min-w-[200px] rounded-2xl border border-slate-600/50 bg-slate-900/60 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all", placeholder: "Admin token", required: true }), _jsx("button", { type: "submit", class: "button gradient-accent px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 hover:scale-105", children: "Save Bets" })] }), _jsx("p", { class: "text-xs text-slate-400", children: "Bets appear immediately on the public page once saved." }), _jsx("p", { class: "text-xs text-emerald-400 font-medium", "data-response": "bets" })] })] }), _jsxs("section", { class: "glass-card rounded-3xl p-8 reveal", children: [_jsx("h2", { class: "text-2xl font-bold text-white mb-3", children: "2. Upload ROI PDF" }), _jsx("p", { class: "mt-2 text-sm text-slate-300 leading-relaxed", children: "Drop the weekly ROI PDF exported from your research deck. Gemini OCR parses totals & individual results, then matches them to open bets automatically. PDF uploads stay private within your worker storage." }), _jsxs("form", { id: "report-upload-form", class: "mt-6 space-y-5", children: [_jsx("input", { type: "file", name: "report", accept: "application/pdf", class: "block w-full rounded-2xl border border-slate-600/50 bg-slate-900/60 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-400", required: true }), _jsxs("div", { class: "flex flex-wrap items-center gap-4", children: [_jsx("input", { name: "adminToken", type: "password", class: "flex-1 min-w-[200px] rounded-2xl border border-slate-600/50 bg-slate-900/60 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all", placeholder: "Admin token", required: true }), _jsx("button", { type: "submit", class: "button gradient-accent px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:scale-105", children: "Process Report" })] }), _jsx("p", { class: "text-xs text-emerald-400 font-medium", "data-response": "report" })] })] }), _jsxs("section", { class: "glass-card rounded-3xl p-8 reveal", children: [_jsx("h2", { class: "text-2xl font-bold text-white mb-3", children: "3. Recent Uploads" }), _jsx("p", { class: "mt-2 text-sm text-slate-300 leading-relaxed", children: "Quick glance at the latest graded reports and their ROI metrics. Refreshes automatically after each successful upload." }), _jsx("div", { "data-admin-reports": true, class: "mt-6 grid gap-3 rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-5 text-sm text-slate-300", children: "Loading recent reports\u2026" })] })] })] }) }));
}
export default app;
