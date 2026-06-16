"""
Aquaponics local Pi-side service:
  - Reads sensor data from Arduino over serial
  - Validates each parameter against expected ranges
  - Serves a local Flask dashboard on :5000 (from local_dashboard/)
  - Every SAMPLE_EVERY_SEC, writes a row to a local SQLite buffer
    (readings.db) — the uploader.py process drains this to the EC2 API

Sensors physically connected: pH, EC, NTU, WT.
DO is not measured yet (probe pending). The buffer stores DO as NULL
so the cloud WQI calculation correctly excludes it from the average.
"""
from __future__ import annotations

import os
import sqlite3
import threading
import time
from datetime import datetime, timezone

import serial
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory

load_dotenv()
SERIAL_PORT      = "/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_A5069RR4-if00-port0"
BUFFER_DB_PATH   = os.getenv("BUFFER_DB_PATH", "/home/pi/aquaponics_dashboard/readings.db")
SAMPLE_EVERY_SEC = int(os.getenv("SAMPLE_EVERY_SEC", "5"))

app = Flask(__name__)

latest = {"PH": 0.0, "EC": 0.0, "NTU": 0.0, "WT": 0.0, "DO": 0.0}
has_real_reading = {k: False for k in latest.keys()}
last_data_time = 0


def valid_reading(sensor: str, value: float) -> bool:
    if sensor == "PH":  return 0 <= value <= 14
    if sensor == "EC":  return 0 <= value <= 10000
    if sensor == "NTU": return 0 <= value <= 1000
    if sensor == "WT":
        if value == -127:
            return False
        return 0 <= value <= 50
    if sensor == "DO":  return 0 <= value <= 20
    return False


def read_serial():
    global last_data_time
    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, 9600, timeout=1)
            print("Arduino connected")
            while True:
                line = ser.readline().decode(errors="ignore").strip()
                if not line:
                    continue
                print(line)
                if not line.startswith("PH="):
                    continue
                values = {}
                try:
                    for item in line.split("|"):
                        key, value = item.split("=")
                        values[key] = float(value)
                except Exception:
                    continue
                for sensor in ["PH", "EC", "NTU", "WT", "DO"]:
                    if sensor not in values:
                        continue
                    value = values[sensor]
                    if valid_reading(sensor, value):
                        latest[sensor] = value
                        has_real_reading[sensor] = True
                    else:
                        print(f"Rejected {sensor}: {value}")
                last_data_time = time.time()
        except Exception as e:
            print("Serial Error:", e)
            time.sleep(2)


def init_db():
    conn = sqlite3.connect(BUFFER_DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS readings (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            ts        TEXT NOT NULL,
            ph        REAL,
            ec        REAL,
            ntu       REAL,
            wt        REAL,
            do_val    REAL,
            uploaded  INTEGER NOT NULL DEFAULT 0
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_readings_uploaded ON readings(uploaded)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_readings_ts        ON readings(ts)")
    conn.commit()
    conn.close()


def buffer_writer_loop():
    conn = sqlite3.connect(BUFFER_DB_PATH, check_same_thread=False)
    while True:
        time.sleep(SAMPLE_EVERY_SEC)
        if time.time() - last_data_time > 10:
            continue
        def db_value(sensor: str):
            return latest[sensor] if has_real_reading[sensor] else None
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        try:
            conn.execute(
                "INSERT INTO readings (ts, ph, ec, ntu, wt, do_val) VALUES (?, ?, ?, ?, ?, ?)",
                (ts, db_value("PH"), db_value("EC"), db_value("NTU"), db_value("WT"), db_value("DO")),
            )
            conn.commit()
        except Exception as e:
            print("Buffer write error:", e)


@app.route("/")
def home():        return send_from_directory("local_dashboard", "index.html")

@app.route("/style.css")
def css():         return send_from_directory("local_dashboard", "style.css")

@app.route("/script.js")
def js():          return send_from_directory("local_dashboard", "script.js")

@app.route("/data")
def data():
    connected = (time.time() - last_data_time) < 10
    return jsonify({
        "PH": latest["PH"], "EC": latest["EC"], "NTU": latest["NTU"],
        "WT": latest["WT"], "DO": latest["DO"], "connected": connected,
    })


if __name__ == "__main__":
    init_db()
    threading.Thread(target=read_serial,        daemon=True).start()
    threading.Thread(target=buffer_writer_loop, daemon=True).start()
    app.run(host="0.0.0.0", port=5000, debug=False)
