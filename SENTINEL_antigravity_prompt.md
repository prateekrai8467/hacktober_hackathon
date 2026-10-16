# SENTINEL — Disaster Damage Assessment Platform
## Master Build Prompt for Antigravity

---

## WHO YOU ARE

You are building SENTINEL, a fully automated satellite-powered disaster damage assessment platform. This is a competition project. The goal is to turn raw space data into actionable ground intelligence the moment a disaster occurs — zero human intervention required from trigger to report. Every feature must be production-quality, not demo quality.

---

## NON-NEGOTIABLE ARCHITECTURE RULE — READ THIS FIRST

**Every single feature is a standalone, isolated module.**

This means:
- Each feature lives in its own folder with its own files, its own database queries, and its own API routes
- No feature imports logic from another feature's internal files. Features only communicate through the shared database or through documented API contracts
- If a developer completely deletes one feature folder, nothing else breaks. The app degrades gracefully — that feature simply becomes unavailable
- Every module has its own error boundary. A crash in the satellite fetch module must never take down the dashboard, the crowdsourcing module, or the alert system
- Every module has a health-check endpoint: `GET /api/{module}/health` returns `{ status: "ok" | "degraded" | "offline", reason: string }`
- Shared utilities (database client, auth helpers, date formatters) live in a `shared/` folder that modules may import from. Shared utilities never import from modules
- The frontend mirrors this: each feature is a self-contained React component tree that fetches its own data independently. If the satellite pipeline is offline, the event sidebar still loads. If the AI report fails, the map still renders

This is the most important instruction in this entire document. Do not deviate from it.

---

## TECH STACK — ALL FREE, NO CREDIT CARD

### Backend
- **Runtime**: Python 3.11 with FastAPI
- **Background jobs**: Python threading + APScheduler (no Redis needed)
- **Geospatial processing**: rasterio, numpy, shapely, geopandas, osmnx
- **HTTP**: httpx for async requests

### Frontend
- **Framework**: React 18 with Vite
- **Map**: Leaflet.js + react-leaflet
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State**: Zustand (lightweight, no Redux complexity)

### Database & Storage
- **Primary DB**: Neon (PostgreSQL + PostGIS) — never pauses, 0.5GB free
- **Auth + Storage SDK**: Supabase — 1GB file storage free, does not pause if Neon is primary DB
- **File Storage**: Cloudflare R2 — 10GB free, zero egress fees
- **Backup/overflow DB**: Supabase PostgreSQL (500MB, pauses after 7 days inactivity — keep-alive cron required)

### External APIs (All Free Tier, All Email Signup Only)
- **Satellite imagery**: Sentinel Hub (sentinelhub.com) — 30,000 processing units/month
- **Fire hotspots**: NASA FIRMS — unlimited free with NASA Earthdata account
- **Elevation data**: SRTM via USGS Earthdata — free
- **Disaster events**: GDACS RSS feed — no auth required
- **Earthquakes**: USGS Earthquake API — no auth required
- **Building footprints**: OpenStreetMap via osmnx — no auth required
- **AI reports**: Groq API — free tier, llama-3.1-70b-versatile
- **Vision analysis**: Google Gemini API — 1,500 requests/day free via Google AI Studio
- **ML inference**: Hugging Face Inference API — free tier
- **Population data**: WorldPop — free raster downloads
- **Weather context**: OpenWeatherMap — 1,000 calls/day free

### Hosting (All Free)
- **Frontend**: Vercel — free tier, unlimited bandwidth for hobby projects
- **Backend**: Railway — $5 credit/month free, enough for a lightweight FastAPI app
- **Cron jobs**: Vercel Cron (free) for keep-alive and scheduled tasks

---

## FREE TIER LIMITS — KNOW THESE AND DESIGN AROUND THEM

### Neon PostgreSQL
- **Storage**: 0.5 GB total
- **Compute**: Scales to zero (cold start ~1 second), never pauses
- **Connections**: 100 concurrent
- **What this means**: Never store raw satellite imagery. Never store full-resolution GeoTIFFs. Only store processed results — GeoJSON that has been simplified to under 300 polygons (~80-200KB per analysis), statistics as flat JSON, text reports
- **Your actual projected usage**: ~60MB for all tables combined. You have 8x headroom

### Supabase
- **Database**: 500MB (use Neon instead to avoid pause risk)
- **File storage**: 1GB
- **Auth**: Unlimited free users
- **Bandwidth**: 5GB/month
- **Critical issue**: Project PAUSES after 7 days of zero activity. Fix this with a Vercel cron job that pings the database every 3 days. Code this on day one
- **Your usage of Supabase**: Auth only + Storage SDK convenience. Primary data in Neon

### Cloudflare R2
- **Storage**: 10GB free
- **Egress**: Zero. Completely free to serve files
- **Operations**: 10M reads/month, 1M writes/month free
- **What goes here**: Field photos from crowdsourcing (~500KB each), satellite imagery thumbnails (~80KB each), exported PDF briefings (~2MB each)
- **Your projected usage**: ~400MB. You have 25x headroom

### Sentinel Hub
- **Free units**: 30,000 processing units/month
- **One Sentinel-2 request (50km area, 10m resolution)**: approximately 50 units
- **This means**: You can process roughly 600 imagery requests per month — about 20 per day
- **Strategy**: Cache aggressively. If the same event area is requested twice with the same date, serve from database — never re-fetch from Sentinel Hub. Only fire requests for new event+date combinations

### Groq API
- **Free tier**: Approximately 14,400 requests/day on free plan
- **Tokens**: 6,000 tokens/minute on free plan
- **Your usage**: One situation report per analysis (about 800 tokens each), so roughly 50 analyses/day is sustainable with margin

### Gemini API
- **Free tier**: 1,500 requests/day, 15 requests/minute
- **Your usage**: One vision analysis per analysis. At 1,500/day you have enormous headroom

### Hugging Face Inference API
- **Free tier**: Rate limited but no hard daily cap for standard models
- **Your usage**: Building damage classification on image chips. Throttle to 100 requests/analysis maximum

### GDACS
- **Completely free**: No authentication, no rate limits on RSS feed
- **Poll frequency**: Every 10 minutes is fine and respectful

### USGS Earthquake API
- **Completely free**: No auth, no rate limits
- **Poll frequency**: Every 5 minutes for recent events

---

## THE 8 MODULES — FULL FEATURE LIST

Build each of these as a completely isolated module as described in the architecture rule above.

---

### MODULE 1 — EVENT MONITOR
**Folder**: `backend/modules/event_monitor/`

**What it does**: Continuously watches disaster feeds and maintains the list of active events. This is the trigger that starts everything else.

**Features to implement**:
- Poll GDACS RSS feed every 10 minutes. Parse all events with Orange or Red alert level. Extract event ID, type (earthquake/flood/cyclone/wildfire), coordinates, severity, affected population, and country
- Poll USGS Earthquake GeoJSON API every 5 minutes for magnitude 5.0+ events
- Poll NASA EONET API daily for volcanic activity, landslides, and storm events
- When a new event appears that does not exist in the database, write it to the events table and emit an internal trigger that other modules can listen for
- Deduplicate events by their source ID. Never create duplicate rows for the same GDACS event ID
- Mark events as inactive automatically when they no longer appear in the GDACS feed for 72 consecutive hours
- Expose `GET /api/events` returning all active events as GeoJSON FeatureCollection, sorted by severity then recency
- Expose `GET /api/events/{id}` returning full detail for one event
- Expose `GET /api/events/module/health` returning module status and last successful poll timestamp

**Database interaction**: Reads and writes `events` table only. Never touches other tables directly.

---

### MODULE 2 — SATELLITE PIPELINE
**Folder**: `backend/modules/satellite_pipeline/`

**What it does**: When triggered by a new event, fetches pre-event and post-event satellite imagery, processes it in memory, and saves only the extracted damage intelligence to the database. Never saves raw imagery.

**Features to implement**:
- Listen for new event triggers from the event monitor (poll `events` table for rows where `pipeline_triggered = false`)
- For each new event, determine the correct satellite source: Sentinel-2 (optical, clear weather) for fire and earthquake damage, Sentinel-1 SAR (radar, works through clouds) for floods and cyclones
- Fetch pre-event imagery: pull the best available Sentinel-2 acquisition from 30–60 days before the event date with lowest cloud cover
- Fetch post-event imagery: pull the most recent acquisition after the event date
- Process entirely in RAM. The numpy arrays live only as long as the function runs. No GeoTIFF files are written to disk or stored anywhere
- For fire damage: compute dNBR (delta Normalized Burn Ratio using NIR band B08 and SWIR band B12). Classify each pixel into severity classes using USGS standard thresholds: enhanced regrowth below -0.25, unburned -0.25 to 0.1, low severity 0.1 to 0.27, moderate-low 0.27 to 0.44, moderate-high 0.44 to 0.66, high severity above 0.66
- For flood damage: compute NDWI change between pre and post imagery. Additionally use Sentinel-1 SAR backscatter thresholding at -16dB for VV polarization to identify open water pixels. Separate permanent water bodies from new flood water
- Convert the pixel-level results to GeoJSON polygons using rasterio's shapes function
- Simplify the resulting GeoJSON to a maximum of 300 polygons using shapely's simplify with tolerance 0.001 degrees. Dissolve adjacent same-severity pixels first, then simplify geometry, then drop polygons smaller than 0.01 km², then keep only the largest 300 if more remain. Final file must be under 250KB
- Compute summary statistics: total affected area in km², percentage of area in each severity class, mean and maximum dNBR score, flood extent in km² if applicable
- Save a compressed JPEG thumbnail (800x800 pixels, quality 75) for both pre and post imagery to Cloudflare R2. Store only the R2 URL in the database, never the image data itself
- Write the simplified GeoJSON, statistics, and thumbnail URLs to the `analyses` table
- Record all available satellite passes (date, cloud cover percentage, tile ID) for the event area in the `satellite_passes` table — this metadata powers the timeline slider
- Expose `POST /api/satellite/trigger` accepting event_id to manually trigger a pipeline run
- Expose `GET /api/satellite/passes/{event_id}` returning all available passes with dates and cloud cover
- Expose `GET /api/satellite/module/health`

**Database interaction**: Reads `events` table for triggers. Writes to `analyses` table and `satellite_passes` table. Reads R2 for thumbnail check. Never touches `building_damage`, `ground_reports`, or `infrastructure_risk` tables directly.

**Critical rule**: If Sentinel Hub is unreachable or over quota, this module fails gracefully and sets `analyses.status = 'imagery_unavailable'`. All other modules continue functioning with whatever data already exists.

---

### MODULE 3 — DAMAGE INTELLIGENCE
**Folder**: `backend/modules/damage_intelligence/`

**What it does**: Takes the damage GeoJSON from the satellite pipeline and runs building-level classification, infrastructure risk assessment, and population impact calculation. This is the AI layer that turns spatial data into structured intelligence.

**Features to implement**:
- Watch for `analyses` rows where `status = 'geojson_ready'` and `building_assessment_status = 'pending'`
- Pull OpenStreetMap building footprints for the event area using osmnx. Query only buildings within the damage envelope. Cache the result in the `osm_cache` table to avoid redundant OSM requests for the same area
- For each building footprint that intersects a damage polygon, extract the damage class from the polygon. Assign the building the severity class of the damage polygon it falls within, weighted by overlap percentage if a building spans multiple zones
- Use the Hugging Face Inference API to run additional damage classification on buildings in the high-severity zone. Throttle to 100 requests per analysis to stay within free limits
- Pull OSM critical infrastructure: hospitals (amenity=hospital), schools (amenity=school), bridges (bridge=yes on highway), power stations (power=station), water treatment (man_made=water_works), cell towers (man_made=mast). Flag any facility that falls within a moderate or higher damage zone
- Compute population impact using WorldPop raster data. The raster file should be downloaded once per country and cached locally. Sum population pixels within each damage severity zone. Report total affected population, population in high-severity zone separately
- Compute an infrastructure risk score per facility type: count of each type within the damage envelope, count at each severity level, percentage in critical zones
- Write individual building records to `building_damage` table. Write infrastructure records to `infrastructure_risk` table. Write population figures back into the `analyses` row
- Expose `GET /api/intelligence/{analysis_id}` returning buildings, infrastructure, and population as a single response
- Expose `GET /api/intelligence/buildings/{event_id}` returning building damage GeoJSON for map rendering
- Expose `GET /api/intelligence/infrastructure/{event_id}` returning critical facilities with risk levels
- Expose `GET /api/intelligence/module/health`

**Database interaction**: Reads `analyses` for triggers. Reads `osm_cache` for building footprints. Writes to `building_damage`, `infrastructure_risk`, `osm_cache`. Updates `analyses.status`. Never triggers satellite pipeline or generates reports.

---

### MODULE 4 — AI REPORTING
**Folder**: `backend/modules/ai_reporting/`

**What it does**: Generates human-readable situation reports and PDF briefings from structured assessment data. Completely independent of how that data was produced.

**Features to implement**:
- Watch for `analyses` rows where `building_assessment_status = 'complete'` and `report_status = 'pending'`
- Construct a structured prompt containing: event type, location, date, damage statistics, infrastructure at risk, population affected, and any available ground truth data from the crowdsourcing module
- Send to Groq API using llama-3.1-70b-versatile at temperature 0.1. Request JSON response with sections: executive_summary (3 sentences maximum), critical_infrastructure (bulleted list of at-risk facilities), priority_zones (top 3 deployment zones with coordinates), resource_recommendations (specific team types and quantities), confidence_note (what limits this assessment), and next_assessment_actions
- Send the pre and post imagery thumbnail URLs to Gemini Vision API. Ask it to describe visible damage, identify structural collapse, characterize flood extent, and rate its own confidence. Merge this qualitative assessment into the report
- Detect disagreements between satellite assessment and any crowdsourced ground reports for the same location. Flag these as disputed zones in the report
- Generate a PDF briefing using a clean template. PDF must include: cover page with event name and date, executive summary, damage map thumbnail, severity breakdown bar chart, infrastructure risk table, priority deployment zones with coordinates, data sources and confidence statement, and timestamp of assessment. Store PDF in Cloudflare R2, save URL to `analyses.pdf_url`
- Assign a unique public slug to each completed analysis (format: 3 random words joined by hyphens, e.g. delta-sierra-seven). This enables the shareable URL feature
- Expose `GET /api/reports/{analysis_id}` returning the full structured report as JSON
- Expose `GET /api/reports/public/{slug}` returning a simplified public version with no authentication required — this powers the shareable URL
- Expose `POST /api/reports/{analysis_id}/regenerate` to force a new report generation
- Expose `GET /api/reports/module/health`

**Database interaction**: Reads `analyses`, `building_damage`, `infrastructure_risk`, `ground_reports`. Writes to `analyses` (report JSON, pdf_url, public_slug, report_status). Never triggers satellite pipeline or building assessment.

---

### MODULE 5 — GROUND TRUTH
**Folder**: `backend/modules/ground_truth/`

**What it does**: Accepts field photo submissions from responders, classifies them with AI, pins them on the map, and cross-validates them against the satellite assessment.

**Features to implement**:
- Accept photo submissions via `POST /api/ground-truth/submit` with fields: latitude, longitude, event_id, optional description, and photo file upload. No login required — rate limit by hashed IP address to 10 submissions per IP per event per hour
- Validate that submitted coordinates are within 200km of the event epicenter. Reject submissions outside this range
- Compress the photo to a maximum of 800KB before uploading. Store in Cloudflare R2 under the path `reports/{event_id}/{uuid}.jpg`. Save the R2 URL in the database, never the file bytes
- Send the compressed photo to Hugging Face Inference API for damage classification. Map the model output to one of four classes: intact, minor damage, major damage, destroyed. Store the class and confidence score
- Look up what the satellite pipeline assessed for the same location by querying the `analyses.damage_geojson` and checking if the submission point falls within any damage polygon. Compute whether the field report agrees or disagrees with the satellite assessment
- If disagreement is detected, set `disputed = true` on the ground report record and update the corresponding building record if one exists for that location
- Expose `GET /api/ground-truth/submissions/{event_id}` returning all submissions as GeoJSON FeatureCollection with damage class, confidence, photo URL, and agreement status
- Expose `GET /api/ground-truth/disputed/{event_id}` returning only disputed reports for cross-validation review
- Expose `GET /api/ground-truth/stats/{event_id}` returning submission count, agreement rate, and class distribution
- Expose `GET /api/ground-truth/module/health`
- The submission form must work as a Progressive Web App with offline capability. Field responders may have intermittent connectivity. Store submissions in browser IndexedDB when offline and auto-submit when connectivity returns. This is a real operational requirement, not a nice-to-have

**Database interaction**: Writes to `ground_reports`. Reads `analyses.damage_geojson` for cross-validation. Updates `building_damage` when a dispute is found. Never triggers satellite pipeline or report generation.

---

### MODULE 6 — RECOVERY TRACKER
**Folder**: `backend/modules/recovery_tracker/`

**What it does**: Runs the damage assessment pipeline on every new satellite pass after the initial event assessment and builds a longitudinal recovery curve showing how the affected area improves over time.

**Features to implement**:
- Every time a new Sentinel-2 pass becomes available for an active event area, automatically trigger a new damage assessment using the same pre-event baseline imagery but the new post-event pass
- Store each re-assessment result as a recovery snapshot: date, high-severity area in km², total affected area in km², buildings still classified as damaged (from xView2 re-run), flood extent if applicable. Append as a new entry to `analyses.recovery_history` JSON array rather than creating a new analysis row
- Compute a recovery score for each new snapshot: percentage of the original high-severity area that has been reclassified to lower severity. Zero means no recovery, 100 means full recovery
- Detect and flag anomalies: if damage worsens between two passes (score decreases), create an alert in `alert_log` with type `severity_escalation`
- Expose `GET /api/recovery/{event_id}` returning the full recovery timeline as an array of snapshots ordered by date, suitable for rendering a line chart
- Expose `GET /api/recovery/{event_id}/latest` returning the most recent snapshot with comparison to previous
- Expose `GET /api/recovery/module/health`

**Database interaction**: Reads `analyses`, `satellite_passes`. Updates `analyses.recovery_history`. Writes to `alert_log`. Reads `events` for active event list.

---

### MODULE 7 — ALERTS ENGINE
**Folder**: `backend/modules/alerts_engine/`

**What it does**: Watches for threshold conditions across all other modules and logs structured alerts. Does not send external notifications (that would require paid services) — instead surfaces alerts prominently in the dashboard.

**Features to implement**:
- Watch for new events from the event monitor with Red severity — log a `new_critical_event` alert
- Watch for analyses where a hospital, school, or bridge falls within a high or critical damage zone — log an `infrastructure_at_risk` alert with the specific facility name and type
- Watch recovery snapshots for worsening damage scores — log a `severity_escalation` alert with before/after statistics
- Watch for new satellite passes becoming available for active events — log a `new_imagery_available` alert with the pass date and cloud cover
- Watch the ground truth module for disputes that reach 5 or more filed for a single location — log a `high_dispute_density` alert suggesting field verification
- Each alert has: id, event_id, alert_type, severity level (info/warning/critical), human-readable message, metadata JSON with the specific data that triggered it, and timestamp
- Expose `GET /api/alerts` returning all unread alerts sorted by severity then recency
- Expose `GET /api/alerts/{event_id}` returning alerts for a specific event
- Expose `POST /api/alerts/{id}/acknowledge` to mark an alert as read
- Expose `GET /api/alerts/module/health`
- Never send emails, push notifications, or webhooks — these all require paid infrastructure. Surface everything in the dashboard UI as a notification panel

**Database interaction**: Reads `analyses`, `infrastructure_risk`, `events`, `ground_reports`. Writes to `alert_log`. Never modifies any other table.

---

### MODULE 8 — PUBLIC DASHBOARD
**Folder**: `frontend/src/modules/`

**What it does**: The complete frontend application. Each frontend feature below is a standalone React component that fetches its own data and fails independently.

**Features to implement**:

**8a. Event Sidebar** — Live list of all active disaster events. Each card shows event name, type icon, severity badge, country, time since event, and an Analyze button. Clicking Analyze triggers analysis for that event and flies the map to that location. Filters for ALL, FIRE, FLOOD, QUAKE, CYCLONE. Auto-refreshes every 60 seconds by polling `/api/events`. If the API is unreachable, show the last known data with a "last updated" timestamp

**8b. Interactive Damage Map** — Leaflet map with damage zone GeoJSON overlay. Layer switcher for: True Color (Sentinel-2 via Sentinel Hub WMTS tiles), OpenStreetMap, dNBR burn severity, Flood extent, Building damage dots. Damage zones colored by severity: dark red for destroyed, amber for major, muted yellow for moderate, dark green for minimal. Clicking a zone shows a popup with severity class, area in km², and dNBR score. Clicking a building dot shows damage class and confidence score. Uses Leaflet's built-in zoom controls. Never uses Google Maps — use OpenStreetMap only

**8c. Split-Screen Before/After Comparison** — A draggable vertical divider on the map. Left side shows pre-event satellite thumbnail, right side shows post-event. The divider is a draggable line controlled by mouse. This uses CSS clip-path on two absolutely positioned image layers. The damage overlay fades in as the divider reveals the post-event side. This is one of the most visually impressive features — build it properly

**8d. Multi-Temporal Timeline** — Horizontal scrollable row of satellite pass thumbnails below the map. Each thumbnail shows the pass date and cloud cover percentage. Passes are colored by event context: dark red background for the event pass, dark blue for the currently selected post-event pass, neutral for all others. A range slider lets users set baseline and current passes for comparison. When the user selects a new pair, the map and before/after comparison both update

**8e. Floating Stat Cards** — Four cards overlaid on the map showing: population at risk, structures assessed with count and percentage, flood extent in km² if applicable, and AI model confidence percentage. Cards use dark semi-transparent backgrounds with colored left borders matching severity

**8f. AI Situation Report Panel** — Right panel showing the structured report from the AI reporting module. Sections: Executive Summary, Critical Infrastructure with color-coded status indicators, Priority Deployment Zones, Resource Recommendations. A Regenerate button calls `/api/reports/{id}/regenerate`. Shows "Powered by Groq + Gemini Vision" attribution. If the report is still generating, show a skeleton loader — never block the rest of the UI

**8g. Damage Severity Bar Chart** — Horizontal bar chart showing percentage breakdown: Destroyed, Major Damage, Minor Damage, No Damage. Uses Recharts. Each bar colored with the corresponding severity color. Shows actual building counts alongside percentages

**8h. Infrastructure Risk Panel** — Table of critical facilities at risk. Rows for hospitals, bridges, power stations, roads, water facilities, cell infrastructure. Each row shows facility type, count at risk, and status badge (CRITICAL / AT RISK / MONITORING). Red for critical, amber for at risk, blue for monitoring

**8i. Recovery Timeline Chart** — Line chart (Recharts) showing recovery score over time from first assessment to most recent pass. X-axis is date, Y-axis is percentage of original damage area still classified as high severity. Declining line means recovery is happening. Include a data point annotation for the event date. Show this chart only after at least two recovery snapshots exist

**8j. Ground Truth Map Layer** — Optional overlay on the main map showing crowdsourced field reports as colored pins. Green pin for intact, amber for minor damage, dark amber for major damage, red for destroyed. Disputed reports (where field data disagrees with satellite) shown as yellow pins with a warning icon. Clicking a pin shows photo thumbnail, damage classification, AI confidence, and whether it agrees with satellite assessment

**8k. Shareable Public Report** — A standalone page at `/report/{public_slug}` that loads a simplified read-only version of the analysis. No navigation, no sidebar — just event title, damage map screenshot, key statistics, executive summary, and timestamp. Accessible by anyone without login. Copy link button. This page must render properly on mobile

**8l. Notification Alert Panel** — Slide-out panel triggered by the alert badge in the navbar. Lists all alerts ordered by severity. Each alert shows type icon, message, timestamp, and an acknowledge button. Unread count shown as a badge. Auto-refreshes every 30 seconds

**8m. Assess My Area Tool** — A public-facing free-draw tool. User draws a polygon on the map and clicks Assess. The system pulls available Sentinel imagery for that exact bounding box and runs the damage detection pipeline for the most recent available post-event period. Rate limited to 3 requests per IP per day by the backend. No login required. Show a progress indicator while processing. This is the viral feature — a resident or journalist can assess any area on Earth with no signup

---

## DATABASE SETUP — COMPLETE SCHEMA

Use Neon as primary database. Enable PostGIS extension on first migration.

### Setup Order
1. Create Neon project at neon.tech with email signup
2. Connect using the provided PostgreSQL connection string
3. Run migrations in the order listed below — each migration is additive and reversible
4. Enable Row Level Security on tables that will be publicly accessible

---

### MIGRATION 001 — EXTENSIONS AND ENUMS

```
Enable the postgis extension for spatial data.
Enable the uuid-ossp extension for UUID generation.

Create an enum type called event_type_enum with values: EQ (earthquake), FL (flood), TC (tropical cyclone), WF (wildfire), VO (volcano), LS (landslide), OTHER.

Create an enum type called severity_enum with values: green, orange, red.

Create an enum type called analysis_status_enum with values: queued, fetching_imagery, imagery_unavailable, running_detection, assessing_buildings, generating_report, complete, error.

Create an enum type called damage_class_enum with values: 0 (no damage), 1 (minor), 2 (major), 3 (destroyed).

Create an enum type called alert_type_enum with values: new_critical_event, imagery_available, infrastructure_at_risk, severity_escalation, high_dispute_density, new_pass_available.

Create an enum type called alert_severity_enum with values: info, warning, critical.

Create an enum type called infra_type_enum with values: hospital, school, bridge, power_station, water_treatment, cell_tower, road_segment, government.

Create an enum type called risk_level_enum with values: critical, high, moderate, low, none.
```

---

### MIGRATION 002 — CORE EVENTS TABLE

```
Create table: events

Columns:
- id: uuid, primary key, default gen_random_uuid()
- gdacs_id: text, unique, not null — source identifier from GDACS feed
- usgs_id: text, unique, nullable — source identifier from USGS if earthquake
- title: text, not null — human readable event name from source feed
- event_type: event_type_enum, not null
- severity: severity_enum, not null
- lat: double precision, not null
- lon: double precision, not null
- location: geography(Point, 4326), generated always as ST_SetSRID(ST_MakePoint(lon, lat), 4326) stored — computed spatial column for geo queries
- event_date: timestamptz, not null — when the disaster occurred
- country: text
- country_code: text — ISO 3166-1 alpha-2
- affected_population: integer, default 0 — from GDACS feed
- active: boolean, default true
- pipeline_triggered: boolean, default false — flag for satellite pipeline to pick up new events
- last_seen_in_feed: timestamptz — updated each poll cycle; used to detect events no longer in feed
- created_at: timestamptz, default now()
- updated_at: timestamptz, default now()

Indexes:
- Spatial index using gist on location column
- Index on (active, event_type) for filtered list queries
- Index on event_date descending for recency sorting
- Index on pipeline_triggered where pipeline_triggered = false (partial index — only unprocessed events)

Constraints:
- Check that lat is between -90 and 90
- Check that lon is between -180 and 180
```

---

### MIGRATION 003 — SATELLITE PASSES TABLE

```
Create table: satellite_passes

Purpose: Stores metadata about every available satellite acquisition for an event area. Never stores actual imagery — only the descriptive metadata needed to populate the timeline slider.

Columns:
- id: uuid, primary key, default gen_random_uuid()
- event_id: uuid, not null, foreign key to events(id) on delete cascade
- pass_date: date, not null — date of satellite acquisition
- sensor: text, not null, default 'S2' — S2 for Sentinel-2 optical, S1_SAR for Sentinel-1 radar, LANDSAT for Landsat 8/9
- cloud_cover_pct: float — 0 to 100, null for SAR (radar is cloud-independent)
- tile_id: text — Sentinel tile reference string, e.g. T36SYC
- bbox: jsonb, not null — bounding box as { lon_min, lat_min, lon_max, lat_max }
- is_event_pass: boolean, default false — true for the pass closest to event date
- is_baseline: boolean, default false — true for the selected pre-event baseline pass
- thumbnail_url: text — Cloudflare R2 URL of the 400px preview thumbnail
- sentinel_hub_request_cached: boolean, default false — if true, this pass has already been fetched and processed; do not re-request from Sentinel Hub
- created_at: timestamptz, default now()

Indexes:
- Index on (event_id, pass_date) for timeline queries
- Index on (event_id, is_event_pass) for fast event pass lookup
- Unique constraint on (event_id, pass_date, sensor) — one record per sensor per day per event
```

---

### MIGRATION 004 — ANALYSES TABLE

```
Create table: analyses

Purpose: The central results table. One row per completed analysis job. Stores simplified GeoJSON, statistics, AI report, and recovery history all in JSONB columns. This design avoids complex joins and keeps the frontend API simple.

Columns:
- id: uuid, primary key, default gen_random_uuid()
- job_id: text, unique, not null — internal processing identifier
- event_id: uuid, not null, foreign key to events(id) on delete cascade
- status: analysis_status_enum, not null, default 'queued'
- pre_pass_id: uuid, foreign key to satellite_passes(id) — which pass was used as baseline
- post_pass_id: uuid, foreign key to satellite_passes(id) — which pass was used as post-event

- damage_geojson: jsonb — simplified polygon GeoJSON, max 300 polygons, max 250KB. Never store raw pixel-level output here. Structure: standard GeoJSON FeatureCollection where each Feature has properties: severity_class (int 0-5), severity_label (text), color (hex), area_km2 (float), dnbr_mean (float)

- stats: jsonb — flat statistics object. Structure: { area_km2: float, high_severity_pct: float, moderate_high_pct: float, moderate_low_pct: float, mean_dnbr: float, max_dnbr: float, flood_extent_km2: float or null, buildings_assessed: int, destroyed_count: int, major_damage_count: int, minor_damage_count: int, confidence: float, sensor_used: text, assessment_method: text }

- infrastructure: jsonb — summary counts only, not individual records. Structure: { hospitals_at_risk: int, bridges_compromised: int, power_stations_offline: int, roads_disrupted_km: float, water_facilities: int, cell_towers_affected: int }

- population: jsonb — Structure: { total_affected: int, high_severity: int, moderate_severity: int, source: text, year: int }

- report: jsonb — AI generated content. Structure: { executive_summary: text, critical_infrastructure: array of strings, priority_zones: array of { name, lat, lon, recommendation }, resource_recommendations: array of strings, confidence_note: text, next_assessment_actions: array of strings, gemini_visual_description: text, generated_at: timestamptz, model_used: text }

- recovery_history: jsonb array, default empty array — each entry: { date: date, high_severity_km2: float, total_affected_km2: float, recovery_score: float 0-100, flood_extent_km2: float or null, pass_id: uuid }

- pre_thumbnail_url: text — R2 URL of pre-event imagery preview
- post_thumbnail_url: text — R2 URL of post-event imagery preview
- pdf_url: text — R2 URL of generated PDF briefing
- public_slug: text, unique — three-word slug for shareable URL, e.g. delta-sierra-seven
- building_assessment_status: text, default 'pending' — pending, running, complete, error
- report_status: text, default 'pending' — pending, generating, complete, error
- processing_time_seconds: integer
- error_message: text
- created_at: timestamptz, default now()
- updated_at: timestamptz, default now()

Indexes:
- Index on (event_id, created_at desc) for event analysis history
- Index on status for pipeline polling queries
- Index on public_slug for shareable URL lookups (partial index where public_slug is not null)
- Index on building_assessment_status where building_assessment_status = 'pending'
- Index on report_status where report_status = 'pending'

Row Level Security:
- Enable RLS on this table
- Policy: authenticated users can read all rows
- Policy: rows where public_slug is not null are readable by anonymous users (powers shareable URL)
- Policy: only service role can insert and update
```

---

### MIGRATION 005 — BUILDING DAMAGE TABLE

```
Create table: building_damage

Purpose: One row per building assessed. Only store buildings within or near damage zones. Buildings clearly outside all damage polygons are not stored — this keeps the table from growing to millions of rows for large events.

Columns:
- id: uuid, primary key, default gen_random_uuid()
- analysis_id: uuid, not null, foreign key to analyses(id) on delete cascade
- event_id: uuid, not null, foreign key to events(id) — denormalized for fast event-level queries without always joining through analyses
- osm_id: text — OpenStreetMap feature ID for linking back to source data
- lat: double precision, not null
- lon: double precision, not null
- location: geography(Point, 4326), generated always as ST_SetSRID(ST_MakePoint(lon, lat), 4326) stored
- damage_class: smallint, not null — 0, 1, 2, or 3
- damage_label: text, not null — no-damage, minor-damage, major-damage, destroyed
- confidence: float — model confidence 0.0 to 1.0
- source: text, default 'satellite' — satellite, xview2, gemini, crowdsource, disputed
- disputed: boolean, default false — set to true when a ground report disagrees
- dispute_resolved: boolean, default false
- created_at: timestamptz, default now()

Indexes:
- Spatial index using gist on location column for geo queries
- Index on (event_id, damage_class) for filtered map rendering
- Index on (analysis_id) for analysis-level queries
- Index on disputed where disputed = true for dispute review queries

Data retention policy:
- Rows for events older than 6 months are deleted by the weekly cleanup job. Summary statistics in the analyses table are preserved permanently. Only the per-building granularity is pruned.
```

---

### MIGRATION 006 — GROUND REPORTS TABLE

```
Create table: ground_reports

Purpose: Crowdsourced field submissions. Contains AI classification of submitted photos, GPS coordinates, and cross-validation status against satellite assessment.

Columns:
- id: uuid, primary key, default gen_random_uuid()
- event_id: uuid, not null, foreign key to events(id)
- analysis_id: uuid, foreign key to analyses(id) — linked after cross-validation
- location: geography(Point, 4326), not null — submitted GPS coordinates
- damage_type: text — collapse, flood, fire, road_blocked, intact, structural_damage, debris
- damage_class: smallint — 0, 1, 2, or 3 from AI classification
- ai_confidence: float
- description: text — optional responder notes, max 500 characters
- photo_r2_key: text — Cloudflare R2 object key, e.g. reports/event_id/uuid.jpg
- photo_url: text — full public URL from R2
- satellite_class: smallint — what the satellite assessment says for this location, null if location is outside any damage polygon
- agreement: boolean — null if satellite_class is null, true if classes match, false if they disagree
- disputed: boolean, default false — set to true when agreement = false
- submitter_hash: text — SHA-256 hash of IP address for rate limiting, never store raw IP
- validated: boolean, default false — manually reviewed by operator
- created_at: timestamptz, default now()

Indexes:
- Spatial index using gist on location for geo proximity queries
- Index on (event_id, created_at desc) for event-level feed
- Index on (event_id, disputed) for dispute review
- Index on submitter_hash for rate limit enforcement

Constraints:
- Check that damage_class is between 0 and 3
- Check that ai_confidence is between 0 and 1 when not null

Data retention:
- Delete rows older than 1 year. Before deletion, aggregate statistics (total submissions, agreement rate, class distribution) are appended to the parent analysis record.
```

---

### MIGRATION 007 — INFRASTRUCTURE RISK TABLE

```
Create table: infrastructure_risk

Purpose: Critical facilities identified as being within or near damage zones. Sourced from OpenStreetMap, cross-referenced against damage GeoJSON.

Columns:
- id: uuid, primary key, default gen_random_uuid()
- analysis_id: uuid, not null, foreign key to analyses(id) on delete cascade
- event_id: uuid, not null, foreign key to events(id)
- osm_id: text — OpenStreetMap feature ID
- facility_type: infra_type_enum, not null
- name: text — facility name from OSM if available
- lat: double precision, not null
- lon: double precision, not null
- location: geography(Point, 4326), generated always as ST_SetSRID(ST_MakePoint(lon, lat), 4326) stored
- risk_level: risk_level_enum, not null
- overlap_pct: float — percentage of facility footprint within damage zone, 0-100
- damage_class_at_location: smallint — severity class of the damage polygon at this location
- notes: text — free text for specific observations, e.g. "only access road is in high damage zone"
- created_at: timestamptz, default now()

Indexes:
- Index on (event_id, facility_type) for filtered infrastructure queries
- Spatial index using gist on location
- Index on (analysis_id, risk_level) for severity-filtered queries
```

---

### MIGRATION 008 — OSM CACHE TABLE

```
Create table: osm_cache

Purpose: Stores OpenStreetMap building footprints and infrastructure data that has already been fetched for an area. Avoids re-querying OSM for the same geographic area on subsequent analyses.

Columns:
- id: uuid, primary key, default gen_random_uuid()
- cache_key: text, unique, not null — computed as MD5 of rounded bbox string, e.g. md5('37.0,36.5,38.0,37.5_buildings')
- bbox: jsonb, not null — { lon_min, lat_min, lon_max, lat_max }
- data_type: text, not null — buildings, hospitals, bridges, power, water, roads
- geojson: jsonb, not null — the OSM response as GeoJSON
- feature_count: integer
- fetched_at: timestamptz, default now()
- expires_at: timestamptz, default now() + interval '30 days' — OSM data refreshed monthly

Indexes:
- Index on cache_key for fast cache hit checks
- Index on expires_at for cache expiry cleanup
```

---

### MIGRATION 009 — ALERT LOG TABLE

```
Create table: alert_log

Purpose: Audit trail of all system-generated alerts. The alerts engine module writes here. The dashboard reads from here.

Columns:
- id: uuid, primary key, default gen_random_uuid()
- event_id: uuid, foreign key to events(id) on delete cascade
- alert_type: alert_type_enum, not null
- severity: alert_severity_enum, not null, default 'info'
- message: text, not null — human readable alert description
- metadata: jsonb — structured data that triggered the alert, varies by type
- acknowledged: boolean, default false
- acknowledged_at: timestamptz
- created_at: timestamptz, default now()

Indexes:
- Index on (acknowledged, created_at desc) for unread alerts feed
- Index on (event_id, alert_type) for event-specific alert queries
- Index on created_at desc for chronological feed

Row Level Security:
- Authenticated users can read all rows
- Only service role can insert
```

---

### MIGRATION 010 — KEEP-ALIVE AND MAINTENANCE

```
Create a function called update_updated_at() that sets updated_at = now() on any row update.

Create triggers calling update_updated_at() on: events (before update), analyses (before update).

Create a function called cleanup_expired_cache() that deletes rows from osm_cache where expires_at < now().

Create a function called cleanup_old_building_data() that deletes rows from building_damage where the related analysis was created more than 6 months ago.

Create a function called deactivate_old_events() that sets active = false on events where last_seen_in_feed < now() - interval '72 hours'.

These functions are called by the backend maintenance module on a weekly cron schedule. They are not automatic database triggers — they are called explicitly to maintain visibility and control.
```

---

## DATA FLOW — HOW MODULES CONNECT THROUGH THE DATABASE

```
Event Monitor writes to: events
    ↓ (satellite_pipeline polls events where pipeline_triggered = false)
Satellite Pipeline reads from: events
Satellite Pipeline writes to: analyses, satellite_passes
Satellite Pipeline updates: events.pipeline_triggered = true
    ↓ (damage_intelligence polls analyses where building_assessment_status = pending)
Damage Intelligence reads from: analyses.damage_geojson, osm_cache
Damage Intelligence writes to: building_damage, infrastructure_risk, osm_cache
Damage Intelligence updates: analyses.infrastructure, analyses.population, analyses.building_assessment_status
    ↓ (ai_reporting polls analyses where building_assessment_status = complete and report_status = pending)
AI Reporting reads from: analyses, building_damage, infrastructure_risk, ground_reports
AI Reporting writes PDF to: Cloudflare R2
AI Reporting updates: analyses.report, analyses.pdf_url, analyses.public_slug, analyses.report_status
    ↓ (recovery_tracker polls satellite_passes for new passes on active events)
Recovery Tracker reads from: satellite_passes, analyses
Recovery Tracker updates: analyses.recovery_history
    ↓ (alerts_engine watches all tables for threshold conditions)
Alerts Engine reads from: analyses, infrastructure_risk, events, ground_reports
Alerts Engine writes to: alert_log

Ground Truth is independent:
Ground Truth accepts user uploads → writes to ground_reports → reads analyses.damage_geojson for cross-validation → updates building_damage.disputed when disagreement found

All modules are read-only with respect to tables they do not own.
```

---

## WHAT NOT TO STORE

This is as important as what to store.

**Never store in any database**:
- Raw GeoTIFF files from Sentinel-2 or Sentinel-1. Process in memory and discard
- Uncompressed pixel arrays. Always compress before any persistence
- Full-resolution satellite imagery of any kind
- Raw OSM downloads larger than 10MB — simplify before storing in osm_cache
- User IP addresses — store SHA-256 hash only
- API keys or secrets — environment variables only, never in database

**Never store in Cloudflare R2**:
- Database backups — use Neon's built-in backup
- Processed GeoJSON — this belongs in the analyses table in the database
- Large video files or any non-image, non-PDF content

**Processing pipeline rule**: Any intermediate numpy array, rasterio dataset, or shapely geometry collection that exists purely during computation lives only in RAM for the duration of the pipeline function. When the function returns, these objects are garbage collected. Only the final simplified GeoJSON and the thumbnail JPEG are ever written anywhere.

---

## ENVIRONMENT VARIABLES REQUIRED

Every module reads its own required variables and fails with a clear error message at startup if any are missing. No module should silently proceed with a missing API key.

```
# Neon PostgreSQL
NEON_DATABASE_URL

# Supabase (Auth + Storage SDK only)
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Cloudflare R2
CF_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_DOMAIN

# Satellite
SENTINEL_HUB_CLIENT_ID
SENTINEL_HUB_CLIENT_SECRET
NASA_EARTHDATA_USERNAME
NASA_EARTHDATA_PASSWORD
NASA_FIRMS_API_KEY

# AI Services
GROQ_API_KEY
GEMINI_API_KEY
HUGGINGFACE_TOKEN

# Weather
OPENWEATHER_API_KEY

# App Config
ENVIRONMENT (development | production)
BACKEND_URL
FRONTEND_URL
RATE_LIMIT_WINDOW_SECONDS
RATE_LIMIT_MAX_REQUESTS
```

---

## FREE TIER SURVIVAL RULES — ENFORCE THESE IN CODE

1. **Sentinel Hub quota guard**: Before every satellite request, check the monthly usage counter stored in the database. If used units exceed 25,000 (out of 30,000), switch to Google Earth Engine as fallback or queue the request for the next month. Never silently fail — always surface quota status in the module health check

2. **Groq rate limit handling**: Wrap every Groq call in exponential backoff with maximum 3 retries. If the call fails after retries, store the analysis data and mark report_status as 'pending' to be retried in 1 hour. Never let a Groq failure cascade into a pipeline failure

3. **Gemini daily limit**: Track Gemini calls in a daily counter reset at midnight UTC. If the counter reaches 1,400, skip Gemini vision analysis for remaining analyses that day and proceed with text-only reports. Note this in the confidence_note section of the report

4. **Neon storage monitor**: The backend exposes a `GET /api/admin/storage` endpoint that queries the current database size. If the database exceeds 400MB (80% of free limit), send an alert and pause the building damage assessment for new events until cleanup runs

5. **R2 storage monitor**: Check R2 bucket size weekly. If it exceeds 8GB (80% of free limit), stop storing field photos for new events and surface a warning in the dashboard

6. **Supabase keep-alive**: A Vercel cron job runs every 3 days hitting `/api/keepalive` which runs a SELECT 1 against the Supabase database. Log the response. If Supabase is paused, this will resume it. This cron must never be disabled

7. **OSM cache aggressively**: Before any OSM query, check the osm_cache table. Only fetch from OSM if no cache hit exists. Cache all OSM responses for 30 days. This is both a rate-limiting courtesy to OSM's free service and a performance optimization

---

## MODULAR FAILURE BEHAVIOR — WHAT HAPPENS WHEN THINGS BREAK

The platform must remain useful even when individual components fail. Define this behavior explicitly:

- Satellite pipeline down → Dashboard shows last known damage assessment with timestamp. Event sidebar still works. Ground truth still accepts submissions. All clearly labeled "Last assessed: X hours ago"
- Groq API down → Maps and statistics still render. Report panel shows "AI report generation temporarily unavailable. Raw assessment data below" and displays the raw stats in formatted tables
- Gemini API limit reached → Reports generate without visual description. A note in the confidence section states imagery analysis was not available for this assessment
- Neon database cold start → First request may take 1-2 seconds. Show a skeleton loader. Never show an error for a cold start
- R2 unavailable → Ground truth submissions queue in browser IndexedDB. Photos display broken image icons but all other data shows. PDF export button disabled with tooltip explaining why
- GDACS unreachable → Use the last successfully fetched event list with a banner: "Event feed last updated X minutes ago"
- OSM unreachable → Use cached building footprints if available. If cache miss, skip building-level assessment and note it in the report. Map still renders damage zones

---

## FINAL INSTRUCTION

Build this system as if it will be handed to an emergency management agency on the day a major disaster hits. Every decision — from database column names to error messages to loading states — should reflect that this tool may be used by someone making life-or-death resource allocation decisions. The satellite data is real. The building counts are real. The infrastructure flags are real.

Build it robust, build it modular, build it to stay within free tiers permanently, and build it to keep working even when half the APIs are down.
```
