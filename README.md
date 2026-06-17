# Smart Aquaponics Monitoring System

A four-tier IoT platform for real-time water-quality monitoring of aquaponics
systems. Captures pH, temperature, EC, and turbidity from physical sensors on
a Raspberry Pi, streams to an AWS-hosted FastAPI backend, and presents live
insights via a Next.js dashboard with an AI-powered diagnostic assistant
(Google Gemini).

🌐 **Live:** https://smart-aquaponics.vercel.app

## What's in this repo
arduino/       # Sensor firmware (Arduino Uno, C++)

pi/            # Raspberry Pi edge gateway (Python, Flask, SQLite)

server/        # FastAPI cloud backend (Python, SQLAlchemy, PostgreSQL)

web/           # Next.js frontend (React 19, Tailwind 4, recharts)

infra/         # nginx config, systemd units

docs/          # Architecture, cost analysis, pause/resume runbooks

## How it works

1. **Arduino** reads pH, EC, water temperature, and turbidity every 5 seconds.
2. **Raspberry Pi** captures the serial stream, buffers to SQLite (7-day
   retention), and uploads batches to the cloud every 30 seconds.
3. **AWS** runs the FastAPI backend on EC2 (gunicorn + nginx + systemd) with
   PostgreSQL on RDS. CloudFront sits in front for global accessibility on
   restrictive networks.
4. **Next.js frontend** on Vercel renders a live dashboard, historical trend
   charts (1h–30d), an API key manager, and a Gemini-powered chat assistant
   with live sensor context.

Full architecture in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Key features

- ✅ **Real-time monitoring** — 5-second sample rate, 1-minute database rollups
- ✅ **AI diagnostics** — Gemini chat with live sensor context for actionable
  recommendations
- ✅ **Trend charts** — 5 parameter charts with configurable time ranges and
  ideal-range overlays
- ✅ **Water Quality Index** — aquaponics-specific 0-100 scoring with status
  banner
- ✅ **Offline resilience** — Pi buffers up to 7 days of data locally, syncs
  when network returns
- ✅ **Secure** — JWT auth, SHA-256 hashed API keys, HTTPS everywhere
- ✅ **Cloud-resilient** — CloudFront in front of EC2 bypasses restrictive
  campus/hostel networks

## Tech stack

| Layer | Tech |
|---|---|
| Sensors | Arduino Uno, Atlas Scientific EZO-EC, DS18B20, analog pH/turbidity |
| Edge | Raspberry Pi 4, Python 3, Flask, pyserial, SQLite |
| API | FastAPI, SQLAlchemy, gunicorn, uvicorn, nginx |
| DB | PostgreSQL 16 (RDS) + pg_cron rollups |
| Frontend | Next.js 16, React 19, Tailwind 4, recharts, shadcn/ui |
| AI | Google Gemini 2.5 Flash |
| Auth | JWT (HS256), bcrypt passwords, SHA-256 API keys |
| Deploy | Vercel (frontend), AWS EC2/RDS (backend) |
| Region | ap-south-1 (Mumbai) |

## Quick start (local development)

### Backend

```bash
cd server/ingest_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # fill in real secrets
# Apply migrations against your DB...
uvicorn app.main:app --reload --port 5001
```

### Frontend

```bash
cd web
pnpm install               # (or npm install)
cp .env.example .env.local # set NEXT_PUBLIC_API_URL=http://localhost:5001
pnpm dev
```

Open http://localhost:3000.

### Pi (when at the tank)

```bash
cd pi
pip install -r requirements.txt --break-system-packages
cp .env.example .env       # fill in INGEST_URL, INGEST_TOKEN, DEVICE_ID
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start aquaponics-app aquaponics-uploader
```

## Documentation

| File | What it covers |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System diagram, components, data flow, repo layout |
| [`docs/COST.md`](./docs/COST.md) | Monthly cost breakdown, pause/resume cost scenarios |
| [`docs/PAUSE.md`](./docs/PAUSE.md) | Snapshot + terminate runbook (~$2/month cold storage) |
| [`docs/RESUME.md`](./docs/RESUME.md) | Restore from snapshots runbook (~30-45 min) |
| [`docs/SECRETS.md`](./docs/SECRETS.md) | Where every credential lives + rotation guide |

## Hardware bill of materials

- Arduino Uno (1x)
- Raspberry Pi 4 with 16+ GB SD card (1x)
- Atlas Scientific EZO-EC + K1.0 conductivity probe (1x)
- DS18B20 waterproof temperature probe (1x)
- pH probe + signal conditioning circuit (1x)
- Analog turbidity sensor with TSW-30 module (1x)
- *Roadmap*: Atlas Scientific EZO-DO + dissolved oxygen probe

## Roadmap

- [ ] Dissolved oxygen sensor (hardware procurement pending)
- [ ] LSTM-based 24-hour parameter forecasting (data collection in progress)
- [ ] Email/SMS alerts on threshold violations
- [ ] Multi-tank support with device grouping
- [ ] Mobile-responsive PWA improvements

## Status

This is an active research project at IIT Kharagpur. Not yet production-grade
for commercial deployment. Issues and contributions welcome.

## Acknowledgements

- Frontend foundation adapted with permission from a peer's BTP project
- Architecture guidance from Prof. Gourav Dhar Bhowmick

## License

MIT (see `LICENSE`)