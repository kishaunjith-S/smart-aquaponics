-- =====================================================================
-- Migration: 002_app_role
-- Purpose: Create dedicated role for the EC2 Flask services
--   (ingest_api inserts readings; dashboard_api reads them).
--   Both run on the EC2 in the same network, can share one role.
-- =====================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_writer') THEN
        CREATE ROLE app_writer LOGIN PASSWORD 'CHANGE_ME_LATER';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE aquaponics TO app_writer;
GRANT USAGE ON SCHEMA public TO app_writer;

-- Reads on both tables (dashboard needs history; ingest needs ON CONFLICT lookup)
GRANT SELECT ON readings, readings_1min TO app_writer;

-- Writes on raw readings only. The rollup table is populated by pg_cron,
-- not by the app, so app_writer doesn't need INSERT on readings_1min.
GRANT INSERT ON readings TO app_writer;

-- BIGSERIAL behind readings.id needs sequence usage to auto-increment
GRANT USAGE, SELECT ON SEQUENCE readings_id_seq TO app_writer;

-- For any tables added in the future migrations, app_writer auto-gets SELECT
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO app_writer;
