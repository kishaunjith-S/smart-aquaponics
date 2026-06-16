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
  if (adc >= 784.9)
  {
    return 0.1 + (2.6 - 0.1) * (798.0 - adc) / (798.0 - 784.9);
  }
  else if (adc >= 762.7)
  {
    return 2.6 + (65.0 - 2.6) * (784.9 - adc) / (784.9 - 762.7);
  }
  else
  {
    return 65.0 + (130.0 - 65.0) * (762.7 - adc) / (762.7 - 737.7);
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
