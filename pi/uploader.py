"""
Drains the local SQLite buffer (written by app.py) into the EC2 ingest API.
"""
from __future__ import annotations

import os
import sqlite3
import time
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

INGEST_URL           = os.getenv("INGEST_URL", "http://localhost:5001")
INGEST_TOKEN         = os.getenv("INGEST_TOKEN")
DEVICE_ID            = os.getenv("DEVICE_ID", "test-pi-01")
BUFFER_DB_PATH       = os.getenv("BUFFER_DB_PATH", "/home/pi/aquaponics_dashboard/readings.db")
UPLOAD_EVERY_SEC     = int(os.getenv("UPLOAD_EVERY_SEC",     "30"))
UPLOAD_BATCH_SIZE    = int(os.getenv("UPLOAD_BATCH_SIZE",    "100"))
RETAIN_UPLOADED_DAYS = int(os.getenv("RETAIN_UPLOADED_DAYS", "7"))

assert INGEST_TOKEN, "INGEST_TOKEN missing in .env"


def fetch_pending(conn):
    cur = conn.execute(
        "SELECT id, ts, ph, ec, ntu, wt, do_val "
        "FROM readings WHERE uploaded = 0 ORDER BY id LIMIT ?",
        (UPLOAD_BATCH_SIZE,),
    )
    return cur.fetchall()


def build_payload(rows):
    readings = [{"ts": ts, "ph": ph, "ec": ec, "ntu": ntu, "wt": wt, "do_val": do}
                for (_id, ts, ph, ec, ntu, wt, do) in rows]
    return {"device_id": DEVICE_ID, "readings": readings}


def mark_uploaded(conn, ids):
    placeholders = ",".join("?" * len(ids))
    conn.execute(f"UPDATE readings SET uploaded = 1 WHERE id IN ({placeholders})", ids)
    conn.commit()


def cleanup_old(conn):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETAIN_UPLOADED_DAYS)) \
        .strftime("%Y-%m-%dT%H:%M:%SZ")
    cur = conn.execute("DELETE FROM readings WHERE uploaded = 1 AND ts < ?", (cutoff,))
    if cur.rowcount > 0:
        print(f"[cleanup] purged {cur.rowcount} rows older than {RETAIN_UPLOADED_DAYS}d")
    conn.commit()


def upload_once(conn):
    rows = fetch_pending(conn)
    if not rows:
        return
    payload = build_payload(rows)
    try:
        resp = requests.post(
            f"{INGEST_URL}/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {INGEST_TOKEN}"},
            timeout=10,
        )
    except requests.exceptions.RequestException as e:
        print(f"[upload] network error: {e} — will retry next tick")
        return

    if resp.status_code == 200:
        body = resp.json()
        ids = [r[0] for r in rows]
        mark_uploaded(conn, ids)
        print(f"[upload] {len(rows)} sent → inserted={body.get('inserted')} skipped={body.get('skipped')}")
    elif resp.status_code == 401:
        print(f"[upload] 401 unauthorized — check INGEST_TOKEN in .env")
    else:
        print(f"[upload] HTTP {resp.status_code}: {resp.text[:200]}")


def main():
    print(f"[boot] device_id={DEVICE_ID} target={INGEST_URL}")
    conn = sqlite3.connect(BUFFER_DB_PATH)
    last_cleanup = 0
    while True:
        upload_once(conn)
        if time.time() - last_cleanup > 3600:
            cleanup_old(conn)
            last_cleanup = time.time()
        time.sleep(UPLOAD_EVERY_SEC)


if __name__ == "__main__":
    main()
