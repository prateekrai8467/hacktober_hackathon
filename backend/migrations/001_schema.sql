-- SENTINEL Full Database Schema (All 10 Migrations)
-- Designed for Neon PostgreSQL + PostGIS

-- 001 EXTENSIONS AND ENUMS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Use DO blocks to create types IF NOT EXISTS
DO $$ BEGIN
    CREATE TYPE event_type_enum AS ENUM ('EQ', 'FL', 'TC', 'WF', 'VO', 'LS', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE severity_enum AS ENUM ('green', 'orange', 'red');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE analysis_status_enum AS ENUM ('queued', 'fetching_imagery', 'imagery_unavailable', 'running_detection', 'assessing_buildings', 'generating_report', 'complete', 'error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE damage_class_enum AS ENUM ('0', '1', '2', '3');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE alert_type_enum AS ENUM ('new_critical_event', 'imagery_available', 'infrastructure_at_risk', 'severity_escalation', 'high_dispute_density', 'new_pass_available');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity_enum AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE infra_type_enum AS ENUM ('hospital', 'school', 'bridge', 'power_station', 'water_treatment', 'cell_tower', 'road_segment', 'government');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE risk_level_enum AS ENUM ('critical', 'high', 'moderate', 'low', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 002 CORE EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gdacs_id TEXT UNIQUE NOT NULL,
    usgs_id TEXT UNIQUE,
    title TEXT NOT NULL,
    event_type event_type_enum NOT NULL,
    severity severity_enum NOT NULL,
    lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lon DOUBLE PRECISION NOT NULL CHECK (lon BETWEEN -180 AND 180),
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED,
    event_date TIMESTAMPTZ NOT NULL,
    country TEXT,
    country_code TEXT,
    affected_population INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    pipeline_triggered BOOLEAN DEFAULT false,
    last_seen_in_feed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_location ON events USING gist(location);
CREATE INDEX IF NOT EXISTS idx_events_active_type ON events (active, event_type);
CREATE INDEX IF NOT EXISTS idx_events_date ON events (event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_pipeline ON events (pipeline_triggered) WHERE pipeline_triggered = false;

-- 003 SATELLITE PASSES TABLE
CREATE TABLE IF NOT EXISTS satellite_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    pass_date DATE NOT NULL,
    sensor TEXT NOT NULL DEFAULT 'S2',
    cloud_cover_pct FLOAT,
    tile_id TEXT,
    bbox JSONB NOT NULL,
    is_event_pass BOOLEAN DEFAULT false,
    is_baseline BOOLEAN DEFAULT false,
    thumbnail_url TEXT,
    sentinel_hub_request_cached BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, pass_date, sensor)
);

CREATE INDEX IF NOT EXISTS idx_passes_event_date ON satellite_passes(event_id, pass_date);
CREATE INDEX IF NOT EXISTS idx_passes_event_pass ON satellite_passes(event_id, is_event_pass);

-- 004 ANALYSES TABLE
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT UNIQUE NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status analysis_status_enum NOT NULL DEFAULT 'queued',
    pre_pass_id UUID REFERENCES satellite_passes(id),
    post_pass_id UUID REFERENCES satellite_passes(id),
    damage_geojson JSONB,
    stats JSONB,
    infrastructure JSONB,
    population JSONB,
    report JSONB,
    recovery_history JSONB DEFAULT '[]'::jsonb,
    pre_thumbnail_url TEXT,
    post_thumbnail_url TEXT,
    pdf_url TEXT,
    public_slug TEXT UNIQUE,
    building_assessment_status TEXT DEFAULT 'pending',
    report_status TEXT DEFAULT 'pending',
    processing_time_seconds INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analyses_event_date ON analyses(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_public_slug ON analyses(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_b_status ON analyses(building_assessment_status) WHERE building_assessment_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_analyses_r_status ON analyses(report_status) WHERE report_status = 'pending';

-- 005 BUILDING DAMAGE TABLE
CREATE TABLE IF NOT EXISTS building_damage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id),
    osm_id TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED,
    damage_class SMALLINT NOT NULL,
    damage_label TEXT NOT NULL,
    confidence FLOAT,
    source TEXT DEFAULT 'satellite',
    disputed BOOLEAN DEFAULT false,
    dispute_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bldg_damage_location ON building_damage USING gist(location);
CREATE INDEX IF NOT EXISTS idx_bldg_damage_filter ON building_damage(event_id, damage_class);
CREATE INDEX IF NOT EXISTS idx_bldg_damage_analysis ON building_damage(analysis_id);
CREATE INDEX IF NOT EXISTS idx_bldg_damage_disputed ON building_damage(disputed) WHERE disputed = true;

-- 006 GROUND REPORTS TABLE
CREATE TABLE IF NOT EXISTS ground_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    analysis_id UUID REFERENCES analyses(id),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    damage_type TEXT,
    damage_class SMALLINT CHECK (damage_class BETWEEN 0 AND 3),
    ai_confidence FLOAT CHECK (ai_confidence BETWEEN 0 AND 1),
    description TEXT,
    photo_storage_key TEXT,
    photo_url TEXT,
    satellite_class SMALLINT,
    agreement BOOLEAN,
    disputed BOOLEAN DEFAULT false,
    submitter_hash TEXT,
    validated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ground_reports_location ON ground_reports USING gist(location);
CREATE INDEX IF NOT EXISTS idx_ground_reports_event ON ground_reports(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ground_reports_disputed ON ground_reports(event_id, disputed);
CREATE INDEX IF NOT EXISTS idx_ground_reports_hash ON ground_reports(submitter_hash);

-- 007 INFRASTRUCTURE RISK TABLE
CREATE TABLE IF NOT EXISTS infrastructure_risk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id),
    osm_id TEXT,
    facility_type infra_type_enum NOT NULL,
    name TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED,
    risk_level risk_level_enum NOT NULL,
    overlap_pct FLOAT,
    damage_class_at_location SMALLINT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infra_risk_location ON infrastructure_risk USING gist(location);
CREATE INDEX IF NOT EXISTS idx_infra_risk_event ON infrastructure_risk(event_id, facility_type);
CREATE INDEX IF NOT EXISTS idx_infra_risk_analysis ON infrastructure_risk(analysis_id, risk_level);

-- 008 OSM CACHE TABLE
CREATE TABLE IF NOT EXISTS osm_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    bbox JSONB NOT NULL,
    data_type TEXT NOT NULL,
    geojson JSONB NOT NULL,
    feature_count INTEGER,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_osm_cache_key ON osm_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_osm_cache_expiry ON osm_cache(expires_at);

-- 009 ALERT LOG TABLE
CREATE TABLE IF NOT EXISTS alert_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    alert_type alert_type_enum NOT NULL,
    severity alert_severity_enum NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    metadata JSONB,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_log_unread ON alert_log(acknowledged, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_log_event ON alert_log(event_id, alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_log_chrono ON alert_log(created_at DESC);

-- QUOTA TRACKING TABLES (For Free Tier Guardrails)
CREATE TABLE IF NOT EXISTS sentinel_quota_log (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    units_used INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sentinel_quota ON sentinel_quota_log(month_key);

CREATE TABLE IF NOT EXISTS gemini_quota_log (
    id SERIAL PRIMARY KEY,
    day_key VARCHAR(10) UNIQUE NOT NULL,
    calls INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 010 MAINTENANCE FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_events_updated ON events;
CREATE TRIGGER trg_events_updated
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_analyses_updated ON analyses;
CREATE TRIGGER trg_analyses_updated
    BEFORE UPDATE ON analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Explicit maintenance functions to be called via cron
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM osm_cache WHERE expires_at < now();
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION cleanup_old_building_data()
RETURNS void AS $$
BEGIN
    DELETE FROM building_damage WHERE analysis_id IN (
        SELECT id FROM analyses WHERE created_at < now() - INTERVAL '6 months'
    );
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION deactivate_old_events()
RETURNS void AS $$
BEGIN
    UPDATE events SET active = false WHERE last_seen_in_feed < now() - INTERVAL '72 hours' AND active = true;
END;
$$ language 'plpgsql';
