# Cost analysis

Smart Aquaponics runs on AWS in the **ap-south-1 (Mumbai)** region.

All prices in USD; conversion examples at ₹95/USD. Verify current pricing at
https://calculator.aws.

## Active monthly cost (24/7, post-free-tier)

| Resource | Spec | Monthly cost | INR @ ₹95/USD |
|---|---:|---:|---:|
| EC2 instance | t3.micro on-demand | $8.61 | ₹818 |
| EBS volume | 20 GB gp3 | $1.82 | ₹173 |
| Public IPv4 | always-assigned | $3.65 | ₹347 |
| RDS instance | db.t4g.micro PostgreSQL | $17.52 | ₹1,664 |
| RDS storage | 20 GB gp3 | $2.30 | ₹219 |
| CloudFront | well within free tier | $0 | ₹0 |
| Data transfer out | < 2 GB/mo, free tier covers | $0 | ₹0 |
| RDS backups | up to DB size = free | $0 | ₹0 |
| **TOTAL** | | **~$33.90** | **~₹3,221** |

Per day: **~₹107**. Per week: **~₹751**.

## Active project budget

For the initial development + 14-day LSTM training data collection window:

| Phase | Days | Cost |
|---|---:|---:|
| Project completion | 5 | ~₹535 |
| LSTM data collection | 14 | ~₹1,503 |
| **Subtotal — active phase** | **19** | **~₹2,038** |

Add ~3-5% for bank USD→INR conversion fee → budget ~₹2,100 for the full
active phase.

## Pause-resume strategies (post-handoff)

When development is complete and the platform needs to be paused (e.g., the
academic team isn't actively working on it), three strategies:

| Scenario | Monthly cost | Resume time | Data risk | When to choose |
|---|---:|---:|---|---|
| **A. Stop EC2, keep RDS running** | ~$22 (₹2,090) | 5 min | None | Coming back within 1-2 weeks |
| **B. Snapshot everything, terminate** ⭐ | **~$2 (₹190)** | 30-45 min | None | Coming back in 1+ month |
| **C. RDS snapshot only, full teardown** | ~$1 (₹95) | 2-3 hours | Low | Long-term cold storage (6+ months) |

### Scenario A: Stop EC2 only

- EC2 stopped: $0 compute
- EBS still attached: $1.82/month
- RDS still running: $19.82/month
- IP address changes on restart (need to update Pi `.env` + LE cert)

### Scenario B: Snapshot + Terminate (recommended)

- EBS snapshot (20 GB): ~$1/month
- RDS snapshot (20 GB): ~$1/month
- Public IPv4 released (no charge)
- Resume via `RESUME.md` runbook in ~30-45 min

This is the **default recommendation** for a 1+ month pause. See `PAUSE.md`
for the exact commands.

### Scenario C: Cold storage

- Only RDS snapshot kept
- EC2 + EBS terminated, rebuild from git repo
- Resume requires running through `DEPLOYMENT.md` from scratch + restoring
  RDS — about 2-3 hours of work

## Why no Free Tier currently

This AWS account is not in the 12-month free tier window. If it were, the
EC2 + RDS + 30 GB storage would all be free, dropping monthly cost to ~$0-2.

If a new AWS account is created for handoff, the first 12 months would be
essentially free for this workload.

## Hidden costs to be aware of

1. **Data transfer (out)**: Pi uploads ~50 KB/min = ~2 GB/month. Free tier
   covers 100 GB/month → **$0**.
2. **Public IPv4 (since Feb 2024)**: $0.005/hour while attached → already
   included above.
3. **Snapshot growth**: snapshots are incremental — only changed blocks
   stored. At 20 GB DB volume, snapshot cost stays ~$1/month.
4. **Cross-region transfer**: $0 within ap-south-1. $0.08/GB if data moves
   to another region.

## Budget guardrails

A monthly Budget alert at $40 is configured on this account
(`aquaponics-project-budget`). Alerts at 85% and 100% sent to
`kishaunjithsenthiljith@gmail.com`. Tripwire — should never fire at current
usage.

To check current spend: AWS Console → Billing → Bills (or Cost Explorer if
IAM permission is attached).

