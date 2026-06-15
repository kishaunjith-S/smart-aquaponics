# Smart Aquaponics Monitoring System (v2)

Cloud-based monitoring and water-quality scoring system for an aquaponics setup.

## Architecture
Arduino sensor hub

│ serial

▼

Raspberry Pi (local Flask dashboard + SQLite buffer + uploader)

│ HTTPS POST (bearer-token auth)

▼

EC2 (FastAPI + Nginx)

│

▼

RDS PostgreSQL (raw readings + pg_cron 1-min rollups)

│

▼

Next.js dashboard (WQI scores + history)
## Repository layout

| Path | Purpose |
|---|---|
| `arduino/` | Sensor hub firmware (pH, EC, turbidity, water temp) |
| `pi/` | Pi-side: local dashboard, SQLite buffer, cloud uploader |
| `server/` | FastAPI backend (ingest API, dashboard API, WQI logic) |
| `web/` | Next.js dashboard frontend |
| `server/migrations/` | PostgreSQL schema migrations |
| `infra/` | Nginx config, systemd units, deployment notes |
| `docs/` | Architecture diagrams, runbooks, handoff notes |

## Sensor parameters

| Parameter | Unit | WQI ideal range | Notes |
|---|---|---|---|
| pH | — | 6.8 – 7.2 | Aquaponic sweet spot |
| Temperature | °C | 22 – 28 | Suits tilapia + leafy greens |
| EC (Conductivity) | µS/cm | 800 – 1500 | Nutrient density indicator |
| Turbidity | NTU | < 5 | Clear water |
| Dissolved Oxygen | mg/L | > 6 | Placeholder column; probe TBD |

## Status

v0 — in active development. Cloud infrastructure (EC2 + RDS + pg_cron rollups) is
provisioned and verified end-to-end with synthetic data.

## Acknowledgments

Frontend design and overall project structure adapted (with permission) from a peer's
[BTP project](https://github.com/ashish297/btp-frontend), with the codebase rewritten
for the aquaponics use case and AWS infrastructure.
