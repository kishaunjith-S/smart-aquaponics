# Secrets inventory

Every credential the system depends on, where it lives, who can see it, and
how to rotate it. Treat this file as a map — never paste actual secret
values here.

## Inventory

| Secret | Purpose | Location(s) | Rotation |
|---|---|---|---|
| `JWT_SECRET` | Signs user JWT access tokens | EC2 `.env` only | Generate fresh; revoke all active sessions when rotated |
| `INGEST_TOKEN` | Legacy shared bearer token for Pi → API | EC2 `.env`, Pi `.env`, password manager | Replace with per-device API keys (already supported) |
| Database `postgres` admin password | Master credential | RDS console, password manager | Via RDS console → Modify → New master password |
| Database `app_writer` password | App-level write role used by FastAPI | EC2 `.env` (in `DATABASE_URL`), password manager | `ALTER USER app_writer WITH PASSWORD '…';` via psql, then update `.env` |
| Database `lstm_reader` password | Read-only role for ML training jobs | Password manager (not in any `.env` yet) | `ALTER USER lstm_reader …` via psql |
| `GEMINI_API_KEY` | Auth to Google Gemini API | EC2 `.env`, password manager | Regenerate in Google AI Studio, update `.env`, restart FastAPI |
| AWS root credentials | AWS account owner | AWS console (root MFA), password manager | AWS root → Security credentials |
| AWS IAM user (`kishaunjith`) credentials | Console + CLI access | AWS console, password manager | IAM → Users → Security credentials → rotate keys |
| GitHub PAT (`ghp_...`) | Push from EC2 and Pi to repo | EC2 `~/.git-credentials`, Pi `~/.git-credentials`, password manager | GitHub → Settings → Developer settings → Personal access tokens |
| User account password (default user) | Login to the platform | Password manager | Re-register or set via DB |
| API keys (per device) | Pi authenticates to `/v1/ingest` | DB (SHA-256 hashed), Pi `.env` (plaintext, only the assigned device) | Revoke via dashboard, generate new |
| Let's Encrypt account key | Cert renewal | EC2 `/etc/letsencrypt/account/` (captured by EBS snapshot) | Reissue via `certbot register --agree-tos` if account lost |

## File locations

### EC2 — `/home/ubuntu/aquaponics/server/ingest_api/.env`
DATABASE_URL=postgresql://app_writer:PASSWORD@HOST:5432/aquaponics

JWT_SECRET=...

INGEST_TOKEN=...

GEMINI_API_KEY=...

CORS_ORIGINS=http://localhost:3000,https://smart-aquaponics.vercel.app

- File mode: `600` (owner read/write only)
- Owner: `ubuntu`
- Backed up implicitly via EBS snapshots (see `PAUSE.md`)
- **Never** commit to git. Verify with: `git check-ignore -v server/ingest_api/.env`

### Pi — `/home/pi/smart-aquaponics/pi/.env`
INGEST_URL=https://d1qkudwjhdvo2i.cloudfront.net

INGEST_TOKEN=...

DEVICE_ID=pi-01           # or test-pi-01 in development

BUFFER_DB_PATH=/home/pi/smart-aquaponics/pi/readings.db

SAMPLE_EVERY_SEC=5

UPLOAD_EVERY_SEC=30

- File mode: `600`
- Owner: `pi`
- Never committed to git (in `.gitignore`)

### Vercel — environment variables

Vercel dashboard → Project → Settings → Environment Variables:

| Name | Used by | Sensitivity |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Browser frontend at build/runtime | Low — it's public anyway |

`NEXT_PUBLIC_*` variables are exposed to the browser. Don't put secrets here.

### Password manager (recommended)

Recommend: 1Password, Bitwarden, or any locked-down vault.

Items to store:
- `aws-aquaponics-root` — root account creds + MFA backup codes
- `aws-aquaponics-iam-kishaunjith` — IAM user creds
- `aquaponics-jwt-secret` — JWT_SECRET value
- `aquaponics-ingest-token` — INGEST_TOKEN value
- `aquaponics-postgres-admin` — postgres master password
- `aquaponics-app-writer-db` — app_writer password
- `aquaponics-lstm-reader-db` — lstm_reader password
- `aquaponics-gemini-api-key` — Gemini key
- `aquaponics-github-pat` — GitHub Personal Access Token
- `aquaponics-user-default` — your platform user login

### Code repo

Should contain **only `.env.example` files** with placeholder values like:
JWT_SECRET=replace-with-strong-random-secret

GEMINI_API_KEY=your-gemini-key-here

Verify with:

```bash
git ls-files | grep -E "\.env$"          # should print nothing
git log --all -p | grep -i password      # should print nothing real
```

## Generating new secrets

### JWT_SECRET

```bash
openssl rand -hex 32
# or
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

### INGEST_TOKEN (if you still use it; prefer API keys instead)

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Strong database password

```bash
python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits + '_-') for _ in range(24)))"
```

## After rotating a secret

Always: update the live `.env` files → restart the consuming service → verify
end-to-end.

```bash
# Example: rotating JWT_SECRET on EC2
nano /home/ubuntu/aquaponics/server/ingest_api/.env   # paste new value
sudo systemctl restart aquaponics-api
curl -s https://d1qkudwjhdvo2i.cloudfront.net/health
```

Rotating `JWT_SECRET` invalidates all existing user JWT tokens — users will
be silently logged out and need to log in again. Plan rotations during
low-traffic windows.

## What's NOT a secret (safe to commit / share)

- CloudFront distribution URL (`d1qkudwjhdvo2i.cloudfront.net`)
- Vercel URL (`smart-aquaponics.vercel.app`)
- nip.io hostname (`13-232-214-65.nip.io`)
- RDS endpoint hostname (it's public DNS, but Security Group locks access)
- EC2 public IP
- Any AWS account ID (it's visible in many places)

## Incident: if a secret leaks

1. **Immediately rotate** the leaked secret using the steps above
2. If it was in a git commit: `git log --all -p -- <file>` to see the full
   history of exposure
3. Force-push history rewrite (`git filter-branch` or `bfg-repo-cleaner`)
   only if the repo is private and nobody else has cloned it
4. If the repo is public or shared: assume the leaked value is compromised
   forever — rotation is the only fix
5. Audit access logs:
   - AWS CloudTrail for credential usage
   - GitHub audit log for PAT usage
   - RDS logs for unusual queries

