# Pi-side service

Runs on the Raspberry Pi co-located with the Arduino sensor hub.

## Files

- `app.py` — reads Arduino serial, validates, serves local dashboard, writes to SQLite buffer
- `uploader.py` — drains SQLite buffer to the EC2 ingest API
- `local_dashboard/` — static HTML/CSS/JS for the on-Pi diagnostic dashboard (port 5000)
- `.env.example` — template for cloud + buffer config (real values in `.env`, gitignored)
- `requirements.txt` — Python deps

## Setup on a fresh Pi

```bash
sudo apt update && sudo apt install -y python3-pip

git clone https://github.com/kishaunjith-S/smart-aquaponics.git
cd smart-aquaponics/pi

pip3 install -r requirements.txt --break-system-packages

cp .env.example .env
nano .env   # fill in INGEST_URL, INGEST_TOKEN, DEVICE_ID
```

## Run

```bash
# Terminal 1
python3 app.py

# Terminal 2
python3 uploader.py
```

systemd units for unattended boot live in `../infra/systemd/` (TODO Day 4).

## ArchitectureArduino → /dev/ttyUSB0 → app.py → readings.db (SQLite) → uploader.py → EC2 /v1/ingest
The SQLite buffer is the resilience layer — if WiFi or EC2 is down, app.py
keeps writing locally and uploader.py drains the backlog when connectivity
returns.
