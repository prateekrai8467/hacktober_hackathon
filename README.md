# TeraScope — Satellite-Powered Disaster Intelligence Platform

> Real-time disaster damage assessment using orbital imagery, AI-driven analysis, and crowdsourced ground truth — built for emergency responders and civilians.

---

## Overview

TeraScope is a full-stack disaster management platform that combines **Sentinel-2 satellite imagery**, **AI damage classification**, and **live event monitoring** to deliver actionable intelligence during natural disasters. The system ingests data from GDACS, USGS, and NASA EONET, processes satellite feeds for damage assessment, generates AI situation reports, and surfaces everything through a real-time dashboard with WebSocket updates.

### Key Capabilities

| Capability | Description |
|---|---|
| **Live Event Monitoring** | Polls GDACS, USGS Earthquakes, and NASA EONET every 5–10 minutes for active disasters worldwide |
| **Satellite Damage Analysis** | Fetches Sentinel-2/SAR imagery, computes NDVI/damage indices, and classifies building-level destruction (Class 0–3) |
| **AI Situation Reports** | Generates narrative reports using Groq LLM + Gemini Vision from satellite before/after imagery |
| **Ground Truth Validation** | Crowdsourced field photo submissions classified by HuggingFace AI and cross-validated against satellite data |
| **Infrastructure Risk Assessment** | OSM-based analysis of hospitals, bridges, power stations, schools within affected zones |
| **Recovery Tracking** | Monitors post-disaster recovery progression through successive satellite passes |
| **Real-Time Alerts** | Threshold-based alert engine for critical events, infrastructure risk, and data disputes |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                      │
│  Landing Page  │  Civilian Dashboard  │  Responder Dashboard    │
│  (Vapor Clinic)│  (Public Access)     │  (Monitor/Intel/Sat)    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST + WebSocket
┌───────────────────────────┴─────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│  Event Monitor │ Satellite Pipeline │ Damage Intelligence       │
│  AI Reporting  │ Ground Truth       │ Recovery Tracker          │
│  Alerts Engine │ WebSocket Manager  │ Quota Guards              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│  Neon PostgreSQL (PostGIS) │ Supabase Storage │ Sentinel Hub    │
│  GDACS/USGS/EONET Feeds   │ Groq LLM         │ Gemini Vision   │
│  HuggingFace (Damage AI)  │ OpenStreetMap     │                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 7.3 | Build tool & dev server |
| Tailwind CSS 3.4 | Styling (dashboard theme + Vapor Clinic landing) |
| GSAP 3 + ScrollTrigger | Cinematic animations (landing page & dashboard transitions) |
| Zustand | Global state management + WebSocket client |
| Leaflet + React-Leaflet | Interactive damage maps |
| Recharts | Severity charts, recovery graphs |
| Lucide React | Icon system |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Async Python API framework |
| asyncpg | PostgreSQL async driver (Neon) |
| APScheduler | Scheduled polling jobs (GDACS, USGS, recovery passes) |
| httpx | Async HTTP client for external APIs |
| NumPy | Satellite imagery damage index computation |
| ReportLab + Pillow | PDF report generation |
| Groq SDK | LLM-powered situation report narratives |
| Google Generative AI | Gemini Vision for satellite image analysis |
| HuggingFace Hub | Ground truth photo damage classification |

### Infrastructure
| Service | Purpose |
|---|---|
| Neon PostgreSQL | Database with PostGIS spatial extensions |
| Supabase Storage | File storage for satellite thumbnails & ground truth photos |
| Sentinel Hub | Sentinel-2/SAR satellite imagery API |

---

## Project Structure

```
TeraScope/
├── backend/
│   ├── main.py                          # FastAPI app, router mounts, scheduler
│   ├── server_simple.py                 # Lightweight mock server (no DB/ML)
│   ├── requirements.txt                 # Python dependencies
│   ├── migrations/
│   │   └── 001_schema.sql               # PostgreSQL schema (10 tables + PostGIS)
│   ├── modules/
│   │   ├── event_monitor/               # GDACS, USGS, EONET polling
│   │   ├── satellite_pipeline/          # Sentinel-2 imagery + damage indices
│   │   ├── damage_intelligence/         # Building-level damage classification
│   │   ├── ai_reporting/                # Groq LLM + Gemini Vision reports
│   │   ├── ground_truth/                # Crowdsourced photo submissions
│   │   ├── recovery_tracker/            # Post-disaster recovery monitoring
│   │   └── alerts_engine/               # Threshold-based real-time alerts
│   └── shared/
│       ├── db.py                        # asyncpg connection pool
│       ├── ws.py                        # WebSocket connection manager
│       ├── r2.py                        # Supabase Storage client
│       └── quota.py                     # API quota guards (Sentinel/Gemini)
│
├── frontend/
│   ├── src/
│   │   ├── landing/                     # Landing page (Vapor Clinic theme)
│   │   │   ├── LandingPage.jsx
│   │   │   └── components/
│   │   │       ├── Navbar.jsx           # Floating Island morphing navbar
│   │   │       ├── HeroSection.jsx      # Full-viewport hero with GSAP stagger
│   │   │       ├── FeaturesSection.jsx  # Interactive micro-UI demo cards
│   │   │       ├── PhilosophySection.jsx # Parallax manifesto + word reveal
│   │   │       ├── ProtocolSection.jsx  # Sticky stacking SVG animations
│   │   │       └── FooterSection.jsx    # CTA band + system status footer
│   │   ├── login/
│   │   │   ├── LoginOrganization.jsx    # Responder login (Vapor Clinic themed)
│   │   │   └── LoginCivilian.jsx        # Civilian login
│   │   ├── dashboards/
│   │   │   ├── civilian/
│   │   │   │   └── CivilianDashboard.jsx
│   │   │   └── responder/
│   │   │       ├── DashboardNavbar.jsx  # GSAP scroll-morphing nav
│   │   │       └── layouts.jsx          # Monitor, Intelligence, Satellite, Assess
│   │   ├── modules/                     # Dashboard feature modules
│   │   │   ├── Hub/                     # Navigation hub (entry point)
│   │   │   ├── DamageMap/               # Leaflet damage heatmap
│   │   │   ├── EventSidebar/            # Live event feed sidebar
│   │   │   ├── AIChat/                  # Emergency AI assistant
│   │   │   ├── AIReportPanel/           # AI-generated situation reports
│   │   │   ├── AlertPanel/              # Real-time alert notifications
│   │   │   ├── AssessMyArea/            # Civilian area assessment tool
│   │   │   ├── BeforeAfterSlider/       # Satellite before/after comparison
│   │   │   ├── GroundTruthLayer/        # Field report map overlay
│   │   │   ├── InfraRiskPanel/          # Infrastructure risk breakdown
│   │   │   ├── PublicReport/            # Public shareable report page
│   │   │   ├── RecoveryChart/           # Recovery progression graphs
│   │   │   ├── SeverityChart/           # Damage severity distribution
│   │   │   ├── StatCards/               # Key metric stat cards
│   │   │   └── Timeline/               # Satellite pass timeline
│   │   ├── App.jsx                      # Router (landing, login, dashboard)
│   │   ├── store.js                     # Zustand store + WebSocket client
│   │   └── index.css                    # Global styles
│   ├── tailwind.config.js
│   └── package.json
│
├── GEMINI.md                            # Landing page builder specification
├── SENTINEL_API_KEYS.env                # API keys (Sentinel Hub, Groq, etc.)
└── README.md
```

---

## ML / AI Models

TeraScope uses three AI/ML systems, none of which require local GPU — all run via cloud APIs:

### 1. Satellite Damage Index (NumPy)
- **What:** Computes NDVI difference and custom damage indices from Sentinel-2 multispectral bands
- **How:** Downloads pre/post-disaster imagery → calculates per-pixel vegetation/structural change → generates damage GeoJSON with classified zones
- **Output:** Building-level damage classes (0 = None, 1 = Minor, 2 = Major, 3 = Destroyed)

### 2. Groq LLM (Situation Reports)
- **Model:** LLaMA-based via Groq API
- **What:** Generates natural-language situation reports from structured damage data
- **Input:** Event metadata + damage statistics + infrastructure risk data
- **Output:** Narrative situation report with executive summary, sector-by-sector breakdown, and recommendations

### 3. Gemini Vision (Satellite Image Analysis)
- **Model:** Google Gemini Pro Vision
- **What:** Analyzes before/after satellite imagery to describe visible structural damage
- **Input:** Satellite thumbnail pairs (pre/post disaster)
- **Output:** Visual damage description integrated into AI situation reports
- **Quota:** 1,500 calls/day (free tier tracked in DB)

### 4. HuggingFace Damage Classifier (Ground Truth)
- **Model:** Image classification model via HuggingFace Inference API
- **What:** Classifies crowdsourced field photos into damage severity classes
- **Input:** Uploaded ground truth photo
- **Output:** Damage class (0–3) + confidence score, cross-validated against satellite assessment

---

## Database Schema

PostgreSQL with PostGIS extension. 10 tables:

| Table | Records |
|---|---|
| `events` | Active disasters with point geometry, severity, type (EQ/FL/TC/WF/VO/LS) |
| `satellite_passes` | Sentinel-2/SAR pass records per event (baseline + event imagery) |
| `analyses` | Full analysis output: damage GeoJSON, stats, infra risk, recovery history |
| `building_damage` | Per-building damage classification with PostGIS coordinates |
| `ground_reports` | Crowdsourced field submissions with AI classification + satellite cross-validation |
| `infrastructure_risk` | Facility-level risk assessment (hospitals, bridges, power) |
| `alert_log` | Typed alerts with acknowledgment workflow |
| `osm_cache` | Cached OpenStreetMap queries (30-day TTL) |
| `sentinel_quota_log` | Monthly Sentinel Hub API usage |
| `gemini_quota_log` | Daily Gemini Vision API calls |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL with PostGIS (or Neon account)

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend (Simple / Mock Mode)

Run without database or ML model connections:

```bash
cd backend
pip install fastapi uvicorn python-dotenv
python server_simple.py
# → http://localhost:8000
```

### Backend (Full Mode)

Requires all API keys configured in `SENTINEL_API_KEYS.env`:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Environment Variables

Create a `.env` file in `backend/` or configure `SENTINEL_API_KEYS.env` in root:

```env
DATABASE_URL=postgresql://user:pass@host/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-key
SENTINEL_CLIENT_ID=your-sentinel-hub-id
SENTINEL_CLIENT_SECRET=your-sentinel-hub-secret
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
HF_TOKEN=your-huggingface-token
FRONTEND_URL=http://localhost:5173
```

---

## Routes

| Path | Description |
|---|---|
| `/` | Landing page (Vapor Clinic theme) |
| `/responder-login` | Responder authentication |
| `/login/civilian` | Civilian portal login |
| `/dashboard/organization` | Responder dashboard (Hub + Alerts) |
| `/dashboard/civilian` | Civilian dashboard |
| `/dashboard/monitor` | Live event monitor with damage map |
| `/dashboard/intelligence` | AI reports + severity + infrastructure risk |
| `/dashboard/satellite` | Before/after satellite comparison + timeline |
| `/report/:slug` | Public shareable disaster report |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/events` | List active disaster events |
| `GET` | `/api/events/:id` | Event details with analysis |
| `POST` | `/api/satellite/analyze` | Trigger satellite analysis for event |
| `GET` | `/api/intelligence/:event_id` | Damage intelligence report |
| `POST` | `/api/reports/generate` | Generate AI situation report |
| `GET` | `/api/reports/:slug` | Public report by slug |
| `POST` | `/api/ground-truth` | Submit field photo report |
| `GET` | `/api/ground-truth/:event_id` | Get ground truth submissions |
| `GET` | `/api/recovery/:event_id` | Recovery tracking data |
| `GET` | `/api/alerts` | Active alerts |
| `PUT` | `/api/alerts/:id/ack` | Acknowledge alert |
| `WS` | `/api/ws` | Real-time WebSocket (events + alerts) |

---

## Design System

### Landing Page — "Vapor Clinic" (Preset D)
| Token | Value |
|---|---|
| Void | `#0A0A14` |
| Plasma | `#7B61FF` |
| Ghost | `#F0EFF4` |
| Graphite | `#18181B` |
| Fonts | Sora (headings), Instrument Serif (drama), Fira Code (mono) |

### Dashboard
| Token | Value |
|---|---|
| Void | `#05050A` |
| Plasma | `#00E5FF` |
| Ghost | `#FFFFFF` |
| Graphite | `#12121A` |

---

## License

MIT

---

Built with orbital intelligence for disaster response.