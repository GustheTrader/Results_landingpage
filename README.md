# webapp – Betting ROI Landing Page & Admin Console

## Project Overview
- **Goal:** Present a professional sports betting landing page with live bet tracking and historical ROI reporting.
- **Public Experience:** Animated landing page that highlights blended performance metrics, current bets in market, and a graded results table.
- **Admin Experience:** Secure console for posting daily picks, uploading weekly ROI PDFs, and automatically grading bets via Gemini OCR.

## Tech Stack
- **Runtime:** Cloudflare Pages + Workers (Hono framework, JSX renderer)
- **Persistence:** Supabase Postgres via REST (`/rest/v1`) for reports, bets, and upload audit history
- **OCR Pipeline:** Google Gemini 1.5 Pro (Vision) over REST
- **Frontend:** Static assets served from `/public/static` with vanilla JS enhancements

## Environment Variables
All secrets live on the Worker. Configure a `.dev.vars` file locally (never commit) and mirror the same keys in production via Wrangler `pages secret put` commands.

| Variable | Purpose |
|----------|---------|
| `ADMIN_TOKEN` | Shared secret required by admin API routes |
| `GEMINI_API_KEY` | Google Gemini 1.5 Pro API key for OCR |
| `SUPABASE_URL` | Base URL of your Supabase project (e.g. `https://xyz.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used for privileged REST calls (bypasses RLS) |
| `SUPABASE_ANON_KEY` (optional) | Fallback key when using custom RLS policies that permit anonymous access |

Example `.dev.vars`:
```env
ADMIN_TOKEN=choose-a-secure-token
GEMINI_API_KEY=your-gemini-api-key
SUPABASE_URL=https://idwgaloohbyofwoaqqgr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key-with-rpc-access
# SUPABASE_ANON_KEY=optional-anon-key-if-using-custom-policies
```

> ⚠️ The worker performs privileged inserts/updates. A **service role key** is recommended; if you rely on the anonymous key, ensure RLS policies explicitly allow the required REST mutations.

## Supabase Database Setup
1. **Create tables** – Run [`migrations/0001_init.sql`](migrations/0001_init.sql) inside the Supabase SQL editor (or via `psql`) to provision the Postgres schema, indexes, and triggers.
2. **Seed sample data (optional)** – Execute [`seed.sql`](seed.sql) to load the provided Week 1–8 report summaries. The script uses `ON CONFLICT (slug)` to upsert safely.
3. **Row Level Security** – Either disable RLS on `reports`, `bets`, and `uploads`, or create policies that allow the service role key to perform all CRUD actions required by the worker.

## Running Locally (Sandbox)
1. Build the production bundle (required before running the Pages dev server):
   ```bash
   npm run build
   ```
2. Launch the Cloudflare Pages dev server (recommended via PM2 in the sandbox):
   ```bash
   npm run dev:sandbox
   ```
3. Visit:
   - Landing page: `http://localhost:3000/`
   - Admin console: `http://localhost:3000/admin`

## Admin Operations
All admin routes require the `x-admin-token` header matching `ADMIN_TOKEN`.

### 1. Add Current Bets
- Form accepts pipe-delimited lines: `Bet title | stake | odds | date | category | description`.
- Backend route: `POST /api/admin/bets`
  ```json
  {
    "bets": [
      {
        "title": "Texans -3",
        "stake": 150,
        "odds": "-110",
        "eventDate": "2025-09-18",
        "category": "Spread",
        "description": "AFC South opener"
      }
    ]
  }
  ```
- Response mirrors Supabase state:
  ```json
  {
    "created": 1,
    "updated": 0,
    "total": 1,
    "bets": [BetRow, ...]
  }
  ```

### 2. Upload ROI PDF
- Form posts `multipart/form-data` to `POST /api/admin/report` with a `report` file field (≤ 5 MB).
- Gemini returns structured metrics and bet outcomes, which are reconciled against pending bets in Supabase.
- Response:
  ```json
  {
    "report": ReportRow,
    "updatedBets": 4,
    "unmatchedBets": ["Parlay card #3"]
  }
  ```

## OCR & PDF Processing Flow
1. Worker converts the uploaded PDF to Base64 and sends it to Gemini 1.5 Pro with a strict JSON schema instruction.
2. Response contains report totals, graded bets, and optional notes.
3. Totals are normalized (currencies, ROIs) before persisting through Supabase REST.
4. Pending bets are matched via lowercase/whitespace-normalized titles; near matches fall back to substring checks.
5. Matched bets update `bets.status`, associate the `report_id`, and write result metadata.

## API Reference
| Method | Path                | Description | Auth |
|--------|---------------------|-------------|------|
| GET    | `/`                 | Landing dashboard | None |
| GET    | `/admin`            | Admin console UI | None |
| GET    | `/api/reports`      | JSON list of reports (newest first) | None |
| GET    | `/api/bets?status=` | JSON list of bets (all or filtered by status) | None |
| POST   | `/api/admin/bets`   | Insert/replace current bets | `x-admin-token` |
| POST   | `/api/admin/report` | OCR + ingest ROI PDF, auto-grade bets | `x-admin-token` |

### Response Shapes
- `GET /api/reports`
  ```json
  { "reports": [ReportRow, ...] }
  ```
- `GET /api/bets`
  ```json
  { "bets": [BetRow, ...] }
  ```
- `POST /api/admin/bets`
  ```json
  { "created": 5, "updated": 2, "total": 7, "bets": [BetRow, ...] }
  ```
- `POST /api/admin/report`
  ```json
  {
    "report": ReportRow,
    "updatedBets": 4,
    "unmatchedBets": ["Parlay card #3"]
  }
  ```

## Data Model (Supabase)
- **reports** – Weekly/daily ROI summaries parsed from PDFs. Unique on `slug`; timestamps maintained via trigger.
- **bets** – Individual wagers. `status` transitions from `pending` → `won/lost/push/void` when matched to a report.
- **uploads** – Audit log for bet ingests and PDF processing, storing filenames, statuses, and the associated report when relevant.

`migrations/0001_init.sql` provisions the schema and trigger logic, while `seed.sql` supplies example report rows for quick demos.

## Deployment
1. Build production assets:
   ```bash
   npm run build
   ```
2. Configure Cloudflare Pages secrets (repeat for each variable):
   ```bash
   npx wrangler pages secret put ADMIN_TOKEN
   npx wrangler pages secret put GEMINI_API_KEY
   npx wrangler pages secret put SUPABASE_URL
   npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY
   ```
3. Deploy (ensure the Cloudflare Pages project name is recorded via `meta_info`):
   ```bash
   npm run deploy:prod
   ```
4. Verify endpoints:
   - `https://<project>.pages.dev/`
   - `https://<project>.pages.dev/admin`
   - `https://<project>.pages.dev/api/reports`

## Testing Supabase Integration
1. Set environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in `.dev.vars`.
2. Start the dev server (`npm run dev:sandbox`).
3. Exercise admin endpoints with curl or Postman, for example:
   ```bash
   curl -X POST http://localhost:3000/api/admin/bets \
     -H "Content-Type: application/json" \
     -H "x-admin-token: $ADMIN_TOKEN" \
     -d '{"bets":[{"title":"Test Bet","stake":50,"odds":"-110"}]}'
   ```
4. Confirm Supabase tables update via the dashboard or SQL editor.

## Future Enhancements
- Persist processed PDFs to Supabase Storage or Cloudflare R2 for audit trails.
- Surface upload history in the admin console via a dedicated `/api/uploads` route.
- Add manual override tools for resolving unmatched bets directly from the UI.
- Integrate email alerts when uploads fail or when unmatched bets remain.
