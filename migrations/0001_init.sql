-- Schema initialization for Supabase (Postgres)
-- Reports capture weekly/daily ROI summaries extracted from PDFs
CREATE TABLE IF NOT EXISTS reports (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  label           TEXT NOT NULL,
  report_date     DATE,
  scope           TEXT,
  total_wagered   NUMERIC(12, 2),
  total_return    NUMERIC(12, 2),
  net_profit      NUMERIC(12, 2),
  roi_percent     NUMERIC(6, 2),
  hit_rate        NUMERIC(5, 2),
  summary         TEXT,
  source_pdf      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_report_date_idx ON reports (report_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports (created_at DESC);

CREATE OR REPLACE FUNCTION set_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reports_updated ON reports;
CREATE TRIGGER trg_reports_updated
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION set_reports_updated_at();


-- Bets store individual wagers
CREATE TABLE IF NOT EXISTS bets (
  id              BIGSERIAL PRIMARY KEY,
  report_id       BIGINT REFERENCES reports(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  stake           NUMERIC(12, 2),
  odds            TEXT,
  decimal_odds    NUMERIC(8, 3),
  event_date      DATE,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | won | lost | push | void
  result_notes    TEXT,
  category        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bets_status_idx ON bets (status);
CREATE INDEX IF NOT EXISTS bets_report_id_idx ON bets (report_id);
CREATE INDEX IF NOT EXISTS bets_updated_at_idx ON bets (updated_at DESC);

CREATE OR REPLACE FUNCTION set_bets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bets_updated ON bets;
CREATE TRIGGER trg_bets_updated
BEFORE UPDATE ON bets
FOR EACH ROW
EXECUTE FUNCTION set_bets_updated_at();


-- Uploads track file-processing lifecycle
CREATE TABLE IF NOT EXISTS uploads (
  id                    BIGSERIAL PRIMARY KEY,
  type                  TEXT NOT NULL,  -- current_bets | result_pdf
  filename              TEXT NOT NULL,
  storage_path          TEXT,
  status                TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | completed | failed
  error                 TEXT,
  processed_report_id   BIGINT REFERENCES reports(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uploads_status_idx ON uploads (status);
CREATE INDEX IF NOT EXISTS uploads_created_at_idx ON uploads (created_at DESC);

CREATE OR REPLACE FUNCTION set_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_uploads_updated ON uploads;
CREATE TRIGGER trg_uploads_updated
BEFORE UPDATE ON uploads
FOR EACH ROW
EXECUTE FUNCTION set_uploads_updated_at();
