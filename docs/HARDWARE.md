# Hardware setup

Physical components, wiring, and assembly for the Smart Aquaponics monitoring
system. Use this when building from scratch or replacing a damaged sensor.

## Bill of Materials

| Component | Specifications | Approx ₹ | Where bought |
|---|---|---:|---|
| Arduino Uno R3 | ATmega328P, 5V, USB-B | 600 | Robu.in / local |
| Raspberry Pi 4 | 4GB+ RAM, with case + 5V/3A USB-C PSU | 5,500 | Official reseller |
| MicroSD card | 32 GB Class 10 (for Pi OS) | 350 | Any |
| pH sensor kit | Industrial grade, BNC + signal board with gain pot | 1,842 | Robu.in [SEN-235871](https://robu.in/product/analog-ph-sensor-kit/) |
| DS18B20 temp probe | Waterproof, 1m cable, stainless tip | 250 | Any |
| 4.7kΩ resistor | For DS18B20 OneWire pullup | 5 | Any |
| Atlas Scientific EZO-EC | UART module + K1.0 conductivity probe | 12,000 | Atlas Scientific (import) |
| Turbidity sensor | Optical, analog output, TS-300B module | 600 | Robu.in |
| Jumper wires | M-M and M-F, ~30 pieces | 100 | Any |
| Breadboard or proto shield | For Arduino prototyping | 200 | Any |
| USB-A to USB-B cable | Arduino ↔ Pi | 100 | Any |
| Waterproof enclosure | IP65, ~200x150x100mm | 500 | Any |
| Cable glands | PG7 / PG9 for waterproof entry | 100 | Any |
| HDMI cable + small monitor | 7" or larger for kiosk display | 1,500 | Optional |

**Total approx ₹23,500** (excluding Pi PSU, microSD, and optional monitor).

## Pin assignments

All sensors connect to the Arduino. The Arduino connects to the Pi via USB.

| Sensor | Arduino Pin | Type | Notes |
|---|---|---|---|
| pH analog signal | A1 | Analog input | 0-5V from signal board |
| Turbidity analog | A0 | Analog input | 0-5V from sensor board |
| DS18B20 data | D4 | Digital (OneWire) | Needs 4.7kΩ pullup to 5V |
| Atlas EZO-EC TX → Arduino RX | D2 | SoftwareSerial | Receives EC values |
| Atlas EZO-EC RX → Arduino TX | D3 | SoftwareSerial | Sends commands |

## Wiring diagram
┌─────────────────────────────┐
          │       Arduino Uno (5V)      │
          │                             │
          │    5V ── powers all modules │
          │   GND ── common ground      │
          │                             │
          │   A0 ─── Turbidity SIG      │
          │   A1 ─── pH SIG (BNC board) │
          │   D2 ─── EZO-EC TX          │
          │   D3 ─── EZO-EC RX          │
          │   D4 ─── DS18B20 DATA (+4.7kΩ pullup to 5V) │
          │                             │
          │   USB-B ── to Pi USB-A      │
          └─────────────────────────────┘
                      │
              USB cable (~1m)
                      │
          ┌─────────────────────────────┐
          │     Raspberry Pi 4          │
          │   /dev/serial/by-id/...     │
          │   reads at 9600 baud        │
          └─────────────────────────────┘

### Detail: pH module wiring

The pH sensor kit (Robu SEN-235871) comes with:
- Signal board (mounted on PCB with BNC + screw terminals)
- pH electrode probe with BNC connector
pH probe BNC ──→ pH board BNC input

pH board V+   ──→ Arduino 5V

pH board GND  ──→ Arduino GND

pH board PO   ──→ Arduino A1 (analog signal, 0-5V)

pH board DO   ──→ (unused — discrete digital output, not needed)

pH board TO   ──→ (unused — temperature output, not needed)
The board has a **gain potentiometer** used during pH 4 calibration (see Calibration below).

### Detail: DS18B20 wiring
DS18B20 Red    ──→ Arduino 5V

DS18B20 Black  ──→ Arduino GND

DS18B20 Yellow ──→ Arduino D4

└─── 4.7kΩ resistor ──→ Arduino 5V (pullup)

The pullup resistor is essential — the OneWire protocol won't work without it.

### Detail: Atlas EZO-EC wiring

EZO-EC has 8 pins. Connect:
EZO V+   ──→ Arduino 5V

EZO GND  ──→ Arduino GND

EZO TX   ──→ Arduino D2 (SoftwareSerial RX in firmware)

EZO RX   ──→ Arduino D3 (SoftwareSerial TX in firmware)

EZO probe BNC ──→ K1.0 conductivity probe

Other EZO pins (LED, etc.) can be left unconnected.

**Important:** Atlas EZO defaults to I2C mode out of the box. Switch to UART mode using the manufacturer's procedure (press button while powering on, see Atlas Scientific datasheet).

### Detail: Turbidity sensor
Turbidity board V+   ──→ Arduino 5V

Turbidity board GND  ──→ Arduino GND

Turbidity board SIG  ──→ Arduino A0

The sensor's signal voltage is **inversely proportional** to turbidity (clearer water = higher voltage = higher ADC).

## Power requirements

- **Arduino:** 5V via USB from Pi (powered & data on same cable)
- **All sensor modules:** 5V from Arduino's 5V pin
- **Pi:** 5V/3A USB-C from wall PSU (mandatory — undersized PSUs cause Arduino USB resets)
- **Total system draw at steady state:** ~5W

For tank deployment, use a **UPS or surge protector** to prevent power-cut SD card corruption.

## Physical installation

### Probe placement in tank
- **pH + EC + temp** should be ~10-15 cm below water surface, away from any inflow/outflow
- **Turbidity** can be at any depth; keep window unobstructed by debris
- Use **cable glands** in the enclosure to maintain waterproofing where probes enter

### Enclosure
- Mount Pi + Arduino inside an IP65 box near the tank, above max water level
- Use **silicone sealant** around cable glands
- Keep the enclosure ventilated (small slot near top, not on water side)

### Cabling
- Probe cables should be at least 1m to allow flexibility
- Use **cable ties + adhesive clips** to secure cables, prevent strain
- Keep sensor cables away from AC mains cables to reduce noise

## Calibration

Current firmware constants (as of June 2026, verified against reference instruments):

| Sensor | Formula in firmware | How calibrated |
|---|---|---|
| pH | `pH = 4.11 * V - 0.88` | 2-point: pH 7 buffer (read 7.01) and pH 10 buffer |
| EC | `EC_corrected = EC_raw × 0.669` | 1-point with 1000 µS/cm (reads 970) |
| Turbidity | 3-point piecewise (ADC 750/733/657 → 0/55/260 NTU) | Verified vs lab turbidity meter |
| Temperature | DS18B20 factory accuracy ±0.5°C | None needed |

### Recalibration procedure

If readings drift or after sensor replacement:

**pH (industrial-grade module):**
1. Dip probe in pH 7 buffer, wait 60s, note voltage at A1
2. Compute new `offset` so the formula returns 7.0
3. Dip in pH 4 buffer, turn the **gain potentiometer** on the board to read 4.0
4. Verify both points before deploying

**EC (Atlas EZO via SoftwareSerial):**
1. Connect Arduino to laptop, use Serial Monitor
2. Send commands: `cal,clear`, then `cal,dry`, then if you have 1413 µS/cm solution: `cal,one,1413`
3. Without solution, keep the `0.669` correction factor in firmware
4. Set temperature compensation: `T,25.0`

**Turbidity (analog):**
1. Distilled water → note ADC for `0 NTU`
2. Known turbidity reference → note ADC for that NTU value
3. Repeat at 3 levels for piecewise linear curve
4. Update `adcToNTU()` function in `arduino/ardi_v1.ino`

See git history of `arduino/ardi_v1.ino` for calibration evolution.

## Sensor maintenance

| Sensor | Frequency | Method |
|---|---|---|
| pH probe | Monthly | Rinse with distilled water, check calibration vs pH 7 buffer |
| pH storage | When unused >1 week | Store in pH 4 buffer or KCl solution (3M), NEVER dry |
| EC probe | Monthly | Rinse with distilled water, dry storage OK |
| DS18B20 | Yearly | Compare to thermometer, replace if drift >1°C |
| Turbidity | Weekly | Wipe optical window with soft cloth — algae buildup affects readings |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `EC=ERR` in output | Atlas EZO not responding | Check UART mode active; check wiring; replace EZO if dead |
| pH stuck at one value | Probe dry / damaged | Store in pH 4 or KCl; if no recovery, replace probe |
| `NTU` reads very high in clean water | Optical window fouled | Clean with cotton swab + distilled water |
| Random Arduino resets | USB cable poor / Pi PSU undersized | Replace cable; use 5V/3A PSU |
| Temperature stuck at 85°C | DS18B20 wiring fault (commonly missing pullup) | Verify 4.7kΩ resistor between D4 and 5V |
| No serial output from Arduino | Code not uploaded or baud rate wrong | Re-upload via Arduino IDE; verify 9600 baud |
