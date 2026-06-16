# Arduino Sensor Hub Firmware

`ardi_v1.ino` runs on an Arduino Uno wired to:

| Sensor | Pin | Notes |
|---|---|---|
| pH probe | A1 (analog) | Calibration: `pH = 4.11 * V - 0.88` (linear fit, refine on calibration day) |
| Turbidity (SEN0189) | A0 (analog) | Three-segment piecewise NTU mapping in `adcToNTU()` |
| Water temperature (DS18B20) | D4 (OneWire) | Returns `-127` when probe is disconnected |
| EC (Atlas EZO-EC) | D2/D3 (SoftwareSerial) | Sends "R\r" command, reads CR/LF terminated response, applies 0.669 correction factor |
| DO | — | Not yet wired; cloud schema accepts NULL until probe is integrated |

## Output frame

Serial output at 9600 baud, one line every ~5 seconds:
PH=7.05|EC=1100.2|NTU=3.4|WT=25.67
If the EC probe is unavailable, `EC=ERR` is emitted instead of a number — the Pi-side parser then rejects that field and stores NULL for EC for that tick.

## Flashing

Open `ardi_v1.ino` in the Arduino IDE, select board "Arduino Uno", select the correct serial port, and click Upload. Required libraries (install via Library Manager): `OneWire`, `DallasTemperature`. `SoftwareSerial` is built-in.

## Next-step roadmap

- Add Atlas EZO-DO via a second SoftwareSerial pair; extend the output frame with `|DO=<mg/L>`. The Pi `valid_reading()` and the cloud schema both already accept this field; no other changes needed.
- Move to hardware serial (Mega) if more probes are added — SoftwareSerial gets unreliable past 1-2 instances at 9600 baud.
