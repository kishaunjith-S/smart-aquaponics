-- =====================================================================
-- Aquaponics monitoring system — initial schema
-- Migration: 001_init
-- Created: 2026-06-15
-- =====================================================================
--
-- This migration creates the base tables for sensor data ingestion and
-- the per-minute rollup that the LSTM training pipeline will consume.
--
-- Conventions:
--   * All timestamps are TIMESTAMPTZ (UTC at rest, presentation in app).
--   * Sensor reading columns are nullable. NULL = no reading / sensor
--     error / probe disconnected. Never store 0.0 as "missing".
--   * device_id is forward-looking — only one Pi today, but adding the
--     column now avoids a painful migration later.
-- =====================================================================

-- Raw 5-second sensor readings (one row per Arduino frame, per device)
CREATE TABLE IF NOT EXISTS readings (
    id          BIGSERIAL    PRIMARY KEY,
    device_id   TEXT         NOT NULL,
    ts          TIMESTAMPTZ  NOT NULL,
    ph          DOUBLE PRECISION,
    ec          DOUBLE PRECISION,
    ntu         DOUBLE PRECISION,
    wt          DOUBLE PRECISION,
    do_val      DOUBLE PRECISION,
    received_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (device_id, ts)
);

CREATE INDEX IF NOT EXISTS idx_readings_device_ts
    ON readings (device_id, ts DESC);

COMMENT ON TABLE readings IS
    'Raw 5-second sensor readings from Pi devices. NULL = no value.';
COMMENT ON COLUMN readings.ts IS
    'Sensor read timestamp (UTC), from the Pi.';
COMMENT ON COLUMN readings.received_at IS
    'Server-side ingest timestamp. ts vs received_at gap = network delay.';
COMMENT ON COLUMN readings.do_val IS
    'Dissolved Oxygen. NULL until a real DO probe is wired in.';


-- Per-minute rollup table (maintained by pg_cron)
CREATE TABLE IF NOT EXISTS readings_1min (
    device_id   TEXT         NOT NULL,
    bucket      TIMESTAMPTZ  NOT NULL,   -- minute-aligned
    ph_avg      DOUBLE PRECISION,
    ph_min      DOUBLE PRECISION,
    ph_max      DOUBLE PRECISION,
    ph_count    INTEGER NOT NULL,
    ec_avg      DOUBLE PRECISION,
    ec_min      DOUBLE PRECISION,
    ec_max      DOUBLE PRECISION,
    ec_count    INTEGER NOT NULL,
    ntu_avg     DOUBLE PRECISION,
    ntu_min     DOUBLE PRECISION,
    ntu_max     DOUBLE PRECISION,
    ntu_count   INTEGER NOT NULL,
    wt_avg      DOUBLE PRECISION,
    wt_min      DOUBLE PRECISION,
    wt_max      DOUBLE PRECISION,
    wt_count    INTEGER NOT NULL,
    do_avg      DOUBLE PRECISION,
    do_min      DOUBLE PRECISION,
    do_max      DOUBLE PRECISION,
    do_count    INTEGER NOT NULL,
    PRIMARY KEY (device_id, bucket)
);

CREATE INDEX IF NOT EXISTS idx_readings_1min_bucket
    ON readings_1min (bucket DESC);

COMMENT ON TABLE readings_1min IS
    'Per-minute aggregates of readings table. Maintained by pg_cron.';
COMMENT ON COLUMN readings_1min.ph_count IS
    '# of non-NULL ph samples in this minute. Use to filter low-quality buckets.';


-- Read-only role for the LSTM developer (you, from your laptop via SSH tunnel)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lstm_reader') THEN
        CREATE ROLE lstm_reader LOGIN PASSWORD 'CHANGE_ME_LATER';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE aquaponics TO lstm_reader;
GRANT USAGE ON SCHEMA public TO lstm_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO lstm_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO lstm_reader;
