# Pause the deployment

When active development is complete and the platform doesn't need to run
24/7, use this runbook to shut down AWS infrastructure while preserving all
data. Drops monthly cost from ~₹3,200 to ~₹190.

Estimated time: 30-45 minutes.

## Pre-pause checklist

Before touching AWS, secure these items off-AWS:

- [ ] Export `/home/ubuntu/aquaponics/server/ingest_api/.env` from EC2 to your
      password manager or encrypted file. (Contains JWT_SECRET, INGEST_TOKEN,
      DATABASE_URL with password, GEMINI_API_KEY.)
- [ ] Export `/home/pi/smart-aquaponics/pi/.env` from the Pi to the same place.
- [ ] Verify the live Vercel URL is bookmarked: `smart-aquaponics.vercel.app`
- [ ] Verify CloudFront URL is noted: `d1qkudwjhdvo2i.cloudfront.net`
- [ ] Confirm GitHub repo is up to date with all code changes pushed
- [ ] Note the current EC2 instance ID and RDS instance identifier (AWS Console)

```bash
# On EC2 — export .env
sudo cat /home/ubuntu/aquaponics/server/ingest_api/.env
# Copy into password manager
```

## Step 1: Final RDS snapshot (manual, kept forever)

AWS Console → RDS → Databases → `aquaponics-db` → **Actions** → **Take snapshot**

- Name: `aquaponics-db-pause-YYYYMMDD` (e.g., `aquaponics-db-pause-20260618`)
- Wait until status is **available** (~5-10 min)

Manual snapshots persist after the DB is deleted. Automated snapshots are
deleted with the DB — that's why a manual one is required.

## Step 2: Create AMI from EC2

AWS Console → EC2 → Instances → select your instance → **Actions** →
**Image and templates** → **Create image**

- Image name: `aquaponics-api-pause-YYYYMMDD`
- Description: "Snapshot before pause"
- Reboot: Yes (cleaner image)
- Click **Create image**

Status will move from **pending → available** in ~5-10 min. Don't proceed
until status is `available`.

This AMI captures the full EC2 disk including `/home/ubuntu/aquaponics/` —
all code, `.env`, venv, systemd config, nginx config, Let's Encrypt cert.

## Step 3: Terminate EC2

After the AMI is `available`:

EC2 → Instances → select instance → **Instance state** → **Terminate
instance** → confirm.

EBS volume is automatically deleted (we have the AMI). Public IPv4 is
released back to AWS.

## Step 4: Delete RDS instance

After the manual snapshot is `available`:

RDS → Databases → `aquaponics-db` → **Actions** → **Delete**
- **Create final snapshot:** uncheck (we already have a manual one)
- **Retain automated backups:** uncheck (the manual snapshot is what we keep)
- Type `delete me` to confirm
- Click **Delete**

Wait 5-10 min for the deletion to complete.

## Step 5: Optional — disable CloudFront

CloudFront stays in free tier even when idle. You can leave it running ($0).

If you want to keep things tidy:
- CloudFront → Distributions → select `aquaponics-api` → **Disable**
- Status becomes `Disabled` (takes ~10 min to propagate globally)
- Re-enable on resume (faster than recreating)

## Step 6: Vercel — leave as-is

Vercel free tier doesn't charge for idle apps. The frontend stays live at
`smart-aquaponics.vercel.app` showing "Failed to load" errors when the
backend is down — that's fine.

If you want to take down the public site too:
- Vercel dashboard → smart-aquaponics → Settings → Advanced → **Pause Project**

## Verification

After all steps:

- EC2 → Instances → no running instances (or only terminated/stopped)
- RDS → Databases → empty (no `aquaponics-db`)
- RDS → Snapshots → `aquaponics-db-pause-YYYYMMDD` (Available)
- EC2 → AMIs → `aquaponics-api-pause-YYYYMMDD` (Available)
- EC2 → Snapshots → linked snapshots from the AMI (Available)

## Ongoing costs after pause

| Resource | Cost |
|---|---:|
| RDS manual snapshot (20 GB) | $0.95/month |
| EC2 AMI + EBS snapshots (20 GB) | $1.00/month |
| CloudFront (disabled or idle) | $0/month |
| Vercel | $0/month |
| **Total** | **~$2/month (~₹190)** |

## Restoring

See `RESUME.md`.

## Notes

- **Snapshots are encrypted with the default AWS-managed KMS key** by default.
  No additional config required.
- **AMI captures EBS volume state at snapshot time.** Any data written to
  `/home/ubuntu/` after that point is lost unless captured in another way.
  For this project, all important state is in the database (RDS snapshot)
  and git (code) — the EBS snapshot mostly captures config files and Let's
  Encrypt certs.
- **The Pi can be shut down** (`sudo shutdown -h now`) and its SQLite buffer
  will be preserved on the SD card. Upload resumes when the Pi powers back
  on and reaches the cloud.