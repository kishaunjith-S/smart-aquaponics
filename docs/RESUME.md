# Resume from snapshots

Use this runbook to restart the platform from snapshots created via
`PAUSE.md`. Brings the system from ~$2/month cold storage back to fully
operational at ~$34/month.

Estimated time: 30-45 minutes.

## Pre-resume checklist

- [ ] AWS account access (same account that holds the snapshots)
- [ ] Password manager has: `postgres` admin password, `app_writer` DB
      password, `lstm_reader` DB password, `JWT_SECRET`, `INGEST_TOKEN`,
      `GEMINI_API_KEY`
- [ ] `aquaponics-db-pause-YYYYMMDD` snapshot exists in RDS → Snapshots
- [ ] `aquaponics-api-pause-YYYYMMDD` AMI exists in EC2 → AMIs

## Step 1: Restore RDS from snapshot

RDS → Snapshots → select `aquaponics-db-pause-YYYYMMDD` → **Actions** →
**Restore snapshot**

Settings to match original:
- **DB instance identifier:** `aquaponics-db` (same as before)
- **DB instance class:** `db.t4g.micro`
- **Storage type:** General Purpose SSD (gp3)
- **Multi-AZ:** No (single AZ to keep costs down)
- **VPC:** default VPC
- **Public access:** Yes (or No if you want stricter SG-based access)
- **VPC security group:** same as before, or recreate one allowing 5432 from
  the EC2 SG
- **DB parameter group:** keep default unless you had a custom one
- **Initial DB name:** leave as-is from snapshot
- Click **Restore DB instance**

Wait 10-15 min for status → **Available**.

Note the new **Endpoint** (e.g.,
`aquaponics-db.xxxxxx.ap-south-1.rds.amazonaws.com`). It may match the
original or have a slightly different suffix — copy it exactly.

## Step 2: Launch EC2 from AMI

EC2 → AMIs → select `aquaponics-api-pause-YYYYMMDD` → **Launch instance from AMI**

- Name: `aquaponics-api`
- Instance type: `t3.micro`
- Key pair: select your existing one (or create new)
- Network: default VPC, default subnet (or same as RDS for low latency)
- Security group: select the existing `aquaponics-sg` (or create new
  allowing 22, 80, 443 from anywhere)
- Storage: 20 GB gp3 (already configured in AMI)
- Click **Launch instance**

Wait ~2-3 min for status → **Running**. Note the new **Public IPv4 address**
(e.g., `13.232.X.Y`) — will differ from the old one.

## Step 3: SSH or Session Manager into the new EC2

Either method works. Session Manager is easier (no SSH key needed):

EC2 → Instances → select new instance → Connect → Session Manager.

```bash
sudo su - ubuntu
cd /home/ubuntu/aquaponics
```

## Step 4: Update DATABASE_URL if endpoint changed

```bash
cat /home/ubuntu/aquaponics/server/ingest_api/.env | grep DATABASE_URL
```

If the RDS endpoint differs from what's in `.env`, update it:

```bash
NEW_ENDPOINT="aquaponics-db.xxxxxxx.ap-south-1.rds.amazonaws.com"
sed -i "s|@.*:5432|@${NEW_ENDPOINT}:5432|" /home/ubuntu/aquaponics/server/ingest_api/.env
cat /home/ubuntu/aquaponics/server/ingest_api/.env | grep DATABASE_URL
```

## Step 5: Reissue Let's Encrypt cert for the new IP

The new EC2 has a new IP, so we need a new cert for the new nip.io hostname:

```bash
NEW_IP=$(curl -s http://checkip.amazonaws.com)
NEW_HOSTNAME=$(echo $NEW_IP | tr '.' '-').nip.io
echo "New hostname: $NEW_HOSTNAME"

sudo certbot --nginx -d $NEW_HOSTNAME \
    --non-interactive --agree-tos \
    --email kishaunjithsenthiljith@gmail.com \
    --redirect
```

Certbot auto-updates the nginx config. Verify:

```bash
curl -s https://$NEW_HOSTNAME/health
```

Should return `{"status":"ok",...}`.

## Step 6: Restart the FastAPI service

```bash
sudo systemctl restart aquaponics-api
sudo systemctl status aquaponics-api --no-pager | head -10
```

Should show `active (running)`. If errors, check logs:

```bash
sudo journalctl -u aquaponics-api -n 50 --no-pager
```

Common issues:
- RDS connection refused → check Security Group allows EC2 → RDS on port 5432
- Wrong DATABASE_URL → re-check Step 4
- Missing GEMINI_API_KEY → restore from password manager

## Step 7: Update CloudFront origin

CloudFront URL (`d1qkudwjhdvo2i.cloudfront.net`) stays the same — Vercel and
Pi don't need updating. But CloudFront's origin now points to the OLD nip.io
hostname which doesn't exist anymore.

CloudFront → Distributions → select `aquaponics-api` → **Origins** tab →
select origin → **Edit**

- **Origin domain:** change from old nip.io to new one (e.g.,
  `13-232-X-Y.nip.io`)
- Save changes

If you disabled the distribution in `PAUSE.md` Step 5: **General** tab →
**Enable**.

Wait 5-15 min for the change to propagate globally.

Verify:

```bash
curl -s https://d1qkudwjhdvo2i.cloudfront.net/health
```

Should return the health JSON.

## Step 8: End-to-end test

Open `https://smart-aquaponics.vercel.app` in a browser. Log in with your
existing credentials. Dashboard should load with all historical data intact.

If the dashboard is empty: the data is there (snapshot was full), but the
auto-refresh hasn't picked it up. Hard-refresh (Ctrl+F5).

## Step 9: Restore the Pi (optional, if hardware is on hand)

The Pi's INGEST_URL still points to CloudFront — no update needed. Just:

```bash
ssh pi@jithpi
sudo systemctl start aquaponics-app aquaponics-uploader
sudo systemctl status aquaponics-app aquaponics-uploader --no-pager
```

The Pi's local SQLite buffer was preserved during the pause — any unsent
readings will upload on the next tick.

## Verification

- [ ] `https://d1qkudwjhdvo2i.cloudfront.net/health` returns 200
- [ ] `https://smart-aquaponics.vercel.app` loads landing page
- [ ] Login works with existing credentials
- [ ] Dashboard shows historical data
- [ ] Trends page shows historical charts
- [ ] Chatbot returns a response

## Cost after resume

Back to ~$34/month (~₹3,221) running 24/7.

## What if you don't have the snapshots?

If both AMI and RDS snapshot are gone:

- Pi data: if the Pi was preserved offline, its SQLite buffer is intact for
  7 days
- All code: in the GitHub repo
- All secrets: in your password manager
- Rebuild from scratch following `docs/DEPLOYMENT.md` (Day 5 deliverable)

The DB historical data is **lost** if neither snapshot nor manual export
exists.