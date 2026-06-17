# Architecture

Smart Aquaponics Monitoring System — a four-tier IoT platform that captures
real-time water-quality data from physical aquaponics tanks, stores it in a
cloud database, and presents live insights via a web dashboard with an
AI-powered diagnostic assistant.

## System diagram
┌──────────────────────────┐

│  ARDUINO UNO             │  Atlas EZO-EC, pH probe, DS18B20 temp,

│  (sensors + ADC)         │  turbidity sensor → Serial USB

└────────────┬─────────────┘

│ 9600 baud, "PH=X|EC=X|NTU=X|WT=X" every 5 s

▼

┌──────────────────────────┐

│  RASPBERRY PI            │  • Flask local dashboard (:5000)

│  (edge gateway)          │  • SQLite buffer (7-day retention)

│                          │  • Uploader → cloud (30 s tick)

└────────────┬─────────────┘

│ HTTPS POST /v1/ingest (idempotent, batched)

▼

┌──────────────────────────┐

│  CLOUDFRONT              │  Public edge → bypass restrictive networks,

│  d1...cloudfront.net     │  free TLS, global CDN

└────────────┬─────────────┘

│ HTTPS to origin (nip.io cert)

▼

┌──────────────────────────┐

│  NGINX → FASTAPI         │  systemd-managed, gunicorn + uvicorn workers,

│  EC2 t3.micro            │  JWT auth, API keys (SHA-256 hashed),

│                          │  Gemini chatbot with live sensor context

└────────────┬─────────────┘

│ SQLAlchemy

▼

┌──────────────────────────┐

│  POSTGRESQL              │  • readings (raw, 5 s sampling)

│  RDS db.t4g.micro        │  • readings_1min (pg_cron rollup every minute)

│                          │  • users, api_keys (auth)

└──────────────────────────┘

▲

│ HTTPS reads (JWT-protected)

│

┌──────────────────────────┐

│  NEXT.JS FRONTEND        │  • Auth (login/register/JWT)

│  smart-aquaponics        │  • Dashboard (WQI table, live banner)

│  .vercel.app             │  • Trends (recharts, 1h-30d ranges, IST)

│                          │  • Chatbot (Gemini, Markdown)

│                          │  • API Keys (CRUD)

└──────────────────────────┘

## Component breakdown

### Tier 1 — Sensors (Arduino)
Reads four physical sensors and emits a single-line frame over Serial USB
every 5 seconds:
- **pH**: analog probe, ADC-converted with two-point calibration
- **Water temperature (WT)**: DS18B20 OneWire on D4
- **Electrical conductivity (EC)**: Atlas EZO-EC via SoftwareSerial (D2/D3),
  custom 0.669 correction factor
- **Turbidity (NTU)**: analog, piecewise-linear calibration

Code: `arduino/ardi_v1.ino`. Output frame: `PH=6.92|EC=1180|NTU=4.5|WT=25.1`.

### Tier 2 — Edge gateway (Raspberry Pi)
Two Python services on systemd:
- `aquaponics-app`: reads serial frames, runs Flask local dashboard on
  :5000, writes valid readings to SQLite (`readings.db`).
- `aquaponics-uploader`: drains the SQLite buffer to the cloud every 30 s,
  batched (up to 100 readings/request). Survives network outages — readings
  accumulate locally and flush when connectivity returns. 7-day retention.

Code: `pi/app.py`, `pi/uploader.py`. systemd units: `pi/systemd/`.

### Tier 3 — Cloud edge (CloudFront)
Cloudfront distribution `d1qkudwjhdvo2i.cloudfront.net` sits in front of the
EC2 origin. Necessary because some networks (e.g., institutional wifi) block
AWS compute IP ranges; CloudFront edge IPs are different and universally
allowed. Free tier covers 1 TB / 10 M requests per month — we use < 1 GB.

Config: `CachingDisabled` (API responses are dynamic), `AllViewer` origin
request policy (forwards Authorization header for JWT).

### Tier 4 — API + Database (EC2 + RDS)
**EC2 t3.micro** running:
- nginx (reverse proxy, HTTPS via Let's Encrypt cert on `13-232-214-65.nip.io`)
- gunicorn + 2 uvicorn workers on `127.0.0.1:5001`
- FastAPI app: auth, ingest, dashboard reads, chat, API key CRUD
- Managed by systemd (`aquaponics-api.service`, auto-restart on failure)

**RDS PostgreSQL db.t4g.micro** with:
- `readings` table — raw inserts from Pi, idempotent via UNIQUE(device_id, ts)
- `readings_1min` table — pg_cron rollup every 60 seconds, averages of avg/min/max
- `users`, `api_keys` — authentication tables

Schema migrations in `server/ingest_api/migrations/`.

### Tier 5 — Frontend (Next.js on Vercel)
Server-side rendered Next.js 16 (App Router) deployed on Vercel free tier.
Auto-deploys on every `git push` to main. Reads from CloudFront URL via
`NEXT_PUBLIC_API_URL`.

Code: `web/`. Live URL: https://smart-aquaponics.vercel.app

## Tech stack

| Layer | Tech |
|---|---|
| Sensor controller | Arduino Uno, C++ |
| Edge gateway | Raspberry Pi 4, Python 3 + Flask + pyserial + SQLite |
| Cloud edge | AWS CloudFront (free tier) |
| API | Python 3, FastAPI, SQLAlchemy, gunicorn + uvicorn, nginx |
| Database | PostgreSQL 16 (RDS), pg_cron for rollups |
| Frontend | Next.js 16, React 19, Tailwind 4, recharts, shadcn/ui |
| Auth | JWT (HS256, python-jose), bcrypt passwords, SHA-256 API keys |
| AI | Google Gemini 2.5 Flash via `google-genai` SDK |
| Deploy | Vercel (frontend), AWS EC2/RDS (backend), GitHub Actions (CI later) |
| Region | ap-south-1 (Mumbai) |

## Repository layout
smart-aquaponics/

├── arduino/              # Sensor firmware (C++)

│   ├── ardi_v1.ino

│   └── README.md

├── pi/                   # Edge gateway (Python)

│   ├── app.py            # Serial reader + local dashboard

│   ├── uploader.py       # SQLite → cloud sync

│   ├── local_dashboard/  # Static HTML for Pi-local viewing

│   ├── systemd/          # systemd unit files

│   ├── requirements.txt

│   └── .env.example

├── server/ingest_api/    # FastAPI backend (Python)

│   ├── app/

│   │   ├── auth.py       # JWT + bcrypt + API key hashing

│   │   ├── models.py     # SQLAlchemy ORM

│   │   ├── schemas.py    # Pydantic models

│   │   ├── routes/       # auth, ingest, dashboard, chat, api_keys

│   │   ├── wqi.py        # Water Quality Index calculation

│   │   └── main.py       # FastAPI app + CORS + router mount

│   ├── migrations/       # SQL schema migrations

│   ├── requirements.txt

│   └── .env.example

├── web/                  # Next.js frontend

│   ├── src/

│   │   ├── app/          # App Router pages

│   │   ├── components/   # Navbar, TrendChart, ui/

│   │   ├── contexts/     # AuthContext (JWT)

│   │   └── lib/api.js    # Axios wrapper, endpoint mapping

│   └── package.json

├── infra/

│   ├── nginx/            # nginx config snapshot

│   └── systemd/          # EC2 systemd unit

└── docs/                 # ← you are here

## Data flow (a single reading, end-to-end)

1. Arduino reads sensors every 5 s, emits serial frame
2. Pi (`app.py`) parses the frame, validates ranges, writes to SQLite with
   `uploaded=0`
3. Pi (`uploader.py`) every 30 s: SELECTs unuploaded rows, sends batch as
   JSON to `https://d1qkudwjhdvo2i.cloudfront.net/v1/ingest` with Bearer
   token, marks `uploaded=1` on success
4. CloudFront proxies the request to nginx on EC2 (`13-232-214-65.nip.io:443`)
5. nginx forwards to FastAPI on `127.0.0.1:5001`
6. FastAPI validates the API key (SHA-256 hash lookup), inserts into
   `readings` table with `ON CONFLICT DO NOTHING` (idempotent)
7. pg_cron job, every minute, INSERTs new minute-buckets into `readings_1min`
8. Frontend's auto-refresh hits `/api/history?limit=200` → reads `readings_1min`
9. Browser renders the WQI banner + table + trend charts

End-to-end latency: typically < 35 s (5 s sample + 30 s uploader tick + ~1 s
network + ~1 min for rollup to be visible in dashboard table).

