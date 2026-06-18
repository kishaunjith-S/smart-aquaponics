#include <SoftwareSerial.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ------------------------
// EC Sensor
// ------------------------
SoftwareSerial ecSerial(2, 3); // RX, TX

// ------------------------
// DS18B20
// ------------------------
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

// ------------------------
// Analog Pins
// ------------------------
#define TURBIDITY_PIN A0
#define PH_PIN A1

// ------------------------
// Turbidity Calibration
// ------------------------
float adcToNTU(float adc)
{
  // 3-point calibration (June 2026, verified against reference meter):
  //   ADC 750 = 0 NTU   (distilled water)
  //   ADC 733 = 55 NTU  (milk-water, lab meter reference)
  //   ADC 657 = 260 NTU (milk-water concentrated, lab meter reference)
  
  if (adc >= 750.0)
  {
    return 0.0;  // clipping cleaner than distilled = 0
  }
  else if (adc >= 733.0)
  {
    // Low range: 0–55 NTU, slope 3.235 NTU per ADC unit
    return 3.235 * (750.0 - adc);
  }
  else
  {
    // High range: 55+ NTU, slope 2.697 NTU per ADC unit
    return 55.0 + 2.697 * (733.0 - adc);
  }
}
void setup()
{
  Serial.begin(9600);
  ecSerial.begin(9600);

  tempSensor.begin();

  delay(2000);

  Serial.println("Aquaponics Sensor Hub Ready");
}

void loop()
{
  // ==========================
  // pH
  // ==========================
  int phADC = analogRead(PH_PIN);
  float phVoltage = phADC * (5.0 / 1023.0);
  float pH = (4.11 * phVoltage) - 0.88;

  // ==========================
  // Turbidity
  // ==========================
  int turbADC = analogRead(TURBIDITY_PIN);
  float ntu = adcToNTU(turbADC);

  // ==========================
  // Water Temperature
  // ==========================
  tempSensor.requestTemperatures();
  float waterTemp = tempSensor.getTempCByIndex(0);

  // ==========================
  // EC
  // ==========================
  while (ecSerial.available())
  {
    ecSerial.read();
  }

  ecSerial.print("R\r");
  delay(1200);

  String response = "";

  while (ecSerial.available())
  {
    char c = ecSerial.read();

    if (c == '\r' || c == '\n')
    {
      if (response.length() > 0)
      {
        break;
      }
    }
    else
    {
      response += c;
    }
  }

  float correctedEC = -1;

  if (response.length() > 0)
  {
    float rawEC = response.toFloat();
    correctedEC = rawEC * 0.669;
  }

  // ==========================
  // Output
  // ==========================
  Serial.print("PH=");
  Serial.print(pH, 2);

  Serial.print("|EC=");
  if (correctedEC >= 0)
    Serial.print(correctedEC, 1);
  else
    Serial.print("ERR");

  Serial.print("|NTU=");
  Serial.print(ntu, 1);

  Serial.print("|WT=");
  Serial.println(waterTemp, 2);

  delay(5000);
}
