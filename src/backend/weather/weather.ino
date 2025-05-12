// Install these libraries below.
#include <DHT11.h>
#include <TimeLib.h>

DHT11 dht11(4);
// Value: 20.
#define gasSensor A0
// Rain sensor without water on it has a value of ~682.
// With a little bit of water: 336.
// Analog pin 1 seems to be a bit inaccurate? Changed to 5.
#define rainSensor A5
// Range: 138-667.
#define solarSensor A2
// Range: 157-686.
// Voltage: 0-1.03 V.
#define windSensor A3

time_t initialTime;

int readGasSensor() {
  unsigned int sensorValue = analogRead(gasSensor);
  unsigned int outputValue = map(sensorValue, 0, 1023, 0, 100);
  return outputValue;
}

void setup() {
  pinMode(gasSensor, INPUT);
  pinMode(rainSensor, INPUT);
  pinMode(solarSensor, INPUT);
  pinMode(windSensor, INPUT);

	// Print to baud rate 9600.
  Serial.begin(9600);

	// Store/Send the time of when the weather staton began operation.
  tmElements_t tm;

  tm.Year = CalendarYrToTm(2025);
  tm.Month = 4;
  tm.Day = 30;
  tm.Hour = 13;
  tm.Minute = 16;
  tm.Second = 0;

  initialTime = makeTime(tm);
}

void loop() {
  String jsonOutput = "";
  
  int temperature = 0;
  int humidity = 0;
  // Value: 22 C Temperature, 35% Humidity.
  int result = dht11.readTemperatureHumidity(temperature, humidity);

  jsonOutput += "{";

  jsonOutput += "\"temperature\": ";
  jsonOutput += result == 0 ? String(temperature) : "\"NaN\"";
  jsonOutput += ", \"humidity\": ";
  jsonOutput += result == 0 ? String(humidity) : "\"NaN\"";

  jsonOutput += ", \"gas\": ";
  jsonOutput += readGasSensor();
  jsonOutput += ", \"rain\": ";
  jsonOutput += analogRead(rainSensor);

	jsonOutput += ", \"solar\": ";
  jsonOutput += analogRead(solarSensor);

	jsonOutput += ", \"wind\": ";
  jsonOutput += analogRead(windSensor);

  jsonOutput += ", \"initialTime\": ";
  jsonOutput += initialTime;

  jsonOutput += "}";

  Serial.println(jsonOutput);

  delay(1 * 1000);
}
