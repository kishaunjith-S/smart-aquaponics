# From-scratch deployment runbook

How to rebuild the entire Smart Aquaponics platform on a fresh AWS account.
Use this when both `PAUSE.md` snapshots and `RESUME.md` restore options are
unavailable — e.g., AWS account changed, regions migrated, total disaster
recovery.

Estimated time: 3-4 hours for someone familiar with AWS basics.

## Prerequisites

- AWS account with billing enabled (account ID handy)
- IAM user with admin access (or root — not recommended long-term)
- Domain name (optional but recommended; can use nip.io for testing)
- A Raspberry Pi 4 with Raspbian/Raspberry Pi OS installed
- Arduino Uno with the project sensor wiring
- Google AI Studio account for Gemini API key
- Vercel account (free tier sufficient)
- GitHub account with this repo cloned

## Step 1: AWS RDS PostgreSQL

AWS Console → RDS → Create database:

- **Engine:** PostgreSQL 16
- **Template:** Free tier (or Production for higher availability)
- **DB instance identifier:** `aquaponics-db`
- **Master username:** `postgres`
- **Master password:** generate a strong one, save to password manager
- **Instance class:** `db.t4g.micro`
- **Storage type:** gp3, 20 GB
- **Public access:** Yes (or No with VPC peering)
- **VPC security group:** create new, allow port 5432 from EC2 security group only
- **Database name (initial):** `aquaponics`
- **Backup retention:** 7 days
- **Enable Performance Insights:** No (saves cost)

Wait ~10 min for status → **Available**. Note the **endpoint**.

### Connect and create roles

```bash
# From any machine with psql installed
psql -h <RDS_ENDPOINT> -U postgres -d aquaponics
```

Then in psql:

```sql
-- Application write role
CREATE ROLE app_writer WITH LOGIN PASSWORD 'YOUR_APP_WRITER_PASSWORD';
GRANT CONNECT ON DATABASE aquaponics TO app_writer;
GRANT USAGE ON SCHEMA public TO app_writer;
GRANT CREATE ON SCHEMA public TO app_writer;

-- Read-only role for future ML training
CREATE ROLE lstm_reader WITH LOGIN PASSWORD 'YOUR_LSTM_READER_PASSWORD';
GRANT CONNECT ON DATABASE aquaponics TO lstm_reader;
GRANT USAGE ON SCHEMA public TO lstm_reader;
-- Grants on tables happen after migrations create them

-- Enable pg_cron for rollups
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## Step 2: AWS EC2 backend

AWS Console → EC2 → Launch instance:

- **Name:** `aquaponics-api`
- **AMI:** Ubuntu Server 24.04 LTS (latest)
- **Instance type:** `t3.micro`
- **Key pair:** create new, save .pem locally
- **VPC:** same as RDS, public subnet
- **Security group:** create `aquaponics-sg` allowing:
  - SSH (port 22) from your IP only
  - HTTP (port 80) from anywhere
  - HTTPS (port 443) from anywhere
- **Storage:** 20 GB gp3
- **Click Launch**

After ~2 min, note the **public IPv4 address**.

### SSH in and install dependencies

```bash
ssh -i your-key.pem ubuntu@<EC2_IP>

# System packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx postgresql-client git certbot python3-certbot-nginx

# Clone the repo
cd /home/ubuntu
git clone https://github.com/<your-username>/smart-aquaponics.git aquaponics
cd aquaponics/server/ingest_api

# Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Configure `.env`

```bash
cp .env.example .env
nano .env
```

Fill in:
DATABASE_URL=postgresql://app_writer:YOUR_APP_WRITER_PASSWORD@<RDS_ENDPOINT>:5432/aquaponics

JWT_SECRET=<generate with: openssl rand -hex 32>

INGEST_TOKEN=<generate with: python3 -c "import secrets; print(secrets.token_urlsafe(32))">

GEMINI_API_KEY=<from Google AI Studio>

CORS_ORIGINS=http://localhost:3000

Lock it down: `chmod 600 .env`

### Run migrations

```bash
cd /home/ubuntu/aquaponics/server/ingest_api
source venv/bin/activate
for f in migrations/*.sql; do
  PGPASSWORD=YOUR_APP_WRITER_PASSWORD psql -h <RDS_ENDPOINT> -U app_writer -d aquaponics -f "$f"
done
```

### Set up systemd service

```bash
sudo nano /etc/systemd/system/aquaponics-api.service
```

```ini
[Unit]
Description=Aquaponics FastAPI backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/aquaponics/server/ingest_api
ExecStart=/home/ubuntu/aquaponics/server/ingest_api/venv/bin/gunicorn \
    -w 2 -k uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:5001 app.main:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable aquaponics-api
sudo systemctl start aquaponics-api
sudo systemctl status aquaponics-api  # verify active (running)
```

### Set up nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/aquaponics
```

```nginx
server {
    listen 80;
    server_name <EC2_IP_DASHED>.nip.io;  # e.g., 13-232-214-65.nip.io

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/aquaponics /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### HTTPS via Let's Encrypt + nip.io

nip.io provides automatic DNS for any IP. Format: `<IP-with-dashes>.nip.io` resolves to that IP.

```bash
EC2_IP=$(curl -s http://checkip.amazonaws.com)
HOSTNAME=$(echo $EC2_IP | tr '.' '-').nip.io
echo "Will issue cert for: $HOSTNAME"

sudo certbot --nginx -d $HOSTNAME \
    --non-interactive --agree-tos \
    --email YOUR_EMAIL@example.com \
    --redirect
```

Cert auto-renews via `certbot.timer`. Verify:
```bash
curl https://$HOSTNAME/health
# Should return: {"status":"ok",...}
```

## Step 3: CloudFront distribution (for wifi-block bypass)

AWS Console → CloudFront → Create distribution:

- **Origin domain:** `<EC2_IP_DASHED>.nip.io`
- **Origin protocol:** HTTPS only
- **Minimum TLS version:** TLSv1.2
- **Cache policy:** CachingDisabled (we have dynamic API)
- **Origin request policy:** AllViewer (forwards Authorization header)
- **Allowed HTTP methods:** GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- **Viewer protocol policy:** Redirect HTTP to HTTPS
- **WAF:** Enable free tier rules
- **Price class:** Use only North America and Europe (cheapest)

After ~10 min deployment, note the **distribution domain name** (e.g., `dXXXXXXX.cloudfront.net`).

Test: `curl https://<cloudfront-domain>/health`

## Step 4: Vercel frontend

Connect GitHub repo to Vercel:

1. https://vercel.com/new → Import Git Repository → select `smart-aquaponics`
2. **Framework:** Next.js (auto-detected)
3. **Root directory:** `web/`
4. **Build command:** `pnpm build` (auto)
5. **Install command:** `pnpm install`
6. **Environment variables:**
   - `NEXT_PUBLIC_API_URL` = `https://<cloudfront-domain>` (from Step 3)
7. **Deploy**

Wait ~3 min for build. Note the live URL (e.g., `smart-aquaponics.vercel.app`).

### Update backend CORS

```bash
ssh ubuntu@<EC2_IP>
nano /home/ubuntu/aquaponics/server/ingest_api/.env
# Update line:
# CORS_ORIGINS=http://localhost:3000,https://<your-vercel-url>
sudo systemctl restart aquaponics-api
```

## Step 5: Custom domain (optional)

In Vercel → project → Settings → Domains → add your custom domain.
Vercel will show the DNS record to add (CNAME) at your registrar.

After DNS propagates (~15 min), Vercel auto-issues SSL via Let's Encrypt.

Update backend CORS to include the custom domain too.

## Step 6: Raspberry Pi edge gateway

```bash
ssh pi@<PI_IP>
mkdir -p ~/smart-aquaponics && cd ~/smart-aquaponics
git clone https://github.com/<your-username>/smart-aquaponics.git .
cd pi
pip install -r requirements.txt --break-system-packages
```

### Configure `.env`

```bash
cp .env.example .env
nano .env
```

Fill in:
INGEST_URL=https://<cloudfront-domain>

INGEST_TOKEN=<same as EC2 .env>

DEVICE_ID=pi-01

BUFFER_DB_PATH=/home/pi/smart-aquaponics/pi/readings.db

SAMPLE_EVERY_SEC=5

UPLOAD_EVERY_SEC=30

### Install systemd units

```bash
sudo cp systemd/aquaponics-app.service /etc/systemd/system/
sudo cp systemd/aquaponics-uploader.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aquaponics-app aquaponics-uploader
sudo systemctl start aquaponics-app aquaponics-uploader

# Verify
sudo systemctl status aquaponics-app aquaponics-uploader
```

## Step 7: Arduino firmware

On laptop:
```bash
git clone https://github.com/<your-username>/smart-aquaponics.git
cd smart-aquaponics/arduino
```

Open `ardi_v1.ino` in Arduino IDE:
- **Board:** Arduino Uno
- **Port:** whatever your Arduino is on
- Install libraries: `OneWire`, `DallasTemperature` (Sketch → Include Library → Manage Libraries)
- Click **Upload**

Verify in Serial Monitor at 9600 baud — should see `PH=X|EC=X|NTU=X|WT=X` every 5 seconds.

Connect Arduino to Pi via USB. The Pi systemd services will auto-detect via `/dev/serial/by-id/`.

## Step 8: Create initial user

```bash
ssh ubuntu@<EC2_IP>
curl -X POST https://<cloudfront-domain>/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"StrongPassword123!"}'
```

Should return a JWT token. You can now log in to the frontend.

## Step 9: End-to-end verification

| Check | URL/command | Expected |
|---|---|---|
| Backend health | `curl https://<cloudfront-domain>/health` | `{"status":"ok"}` |
| Frontend loads | open Vercel URL in browser | Landing page renders |
| Login works | log in via UI | Dashboard loads |
| Pi sending data | dashboard auto-refreshes | New rows every minute |
| Trends page | navigate to /trends | Charts render with data |
| Chatbot | navigate to /chatbot | Gemini responds with analysis |
| API keys | navigate to /api-keys | Can generate new keys |

If all green: deployment complete. 🎉

## Sensor calibration

After hardware is connected, follow the calibration procedure in
`docs/HARDWARE.md` (or use the constants in the committed firmware which
are calibrated against reference solutions as of June 2026).

## Troubleshooting

- **502 from CloudFront** → check EC2 nginx + systemd: `sudo journalctl -u aquaponics-api -n 50`
- **Database connection refused** → verify RDS Security Group allows EC2 SG on port 5432
- **CORS errors** → verify `CORS_ORIGINS` includes the frontend URL exactly
- **Cert renewal fails** → `sudo certbot renew --dry-run`, may need to re-issue if IP changed
- **Pi not uploading** → check `journalctl -u aquaponics-uploader -n 50`, verify INGEST_URL and INGEST_TOKEN
- **Arduino reset loop** → cable issue or DTR being toggled; try a different USB cable

## Ongoing cost expectation

See `docs/COST.md`. Roughly $33/month if running 24/7. Use `PAUSE.md` to
suspend infrastructure when not actively developing.

