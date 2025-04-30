// Install these libraries below1
#include <DHT11.h>
#include <TimeLib.h>

DHT11 dht11(4);
// Value: 20.
#define gasSensor A0
// Rain sensor without water on it has a value of ~682.
// With a little bit of water: 336.
#define rainSensor A1

time_t initialTime;

int readGasSensor() {
  unsigned int sensorValue = analogRead(gasSensor);
  unsigned int outputValue = map(sensorValue, 0, 1023, 0, 100);
  return outputValue;
}

void setup() {
  // put your setup code here, to run once:
  pinMode(gasSensor, INPUT);
  pinMode(rainSensor, INPUT);
  Serial.begin(9600);

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

  jsonOutput += "[{";

  jsonOutput += "\"temperature\": ";
  jsonOutput += result == 0 ? "NaN" : String(temperature);
  jsonOutput += ", \"humidity\": ";
  jsonOutput += result == 0 ? "NaN" : String(humidity);

  jsonOutput += ", \"gas\": ";
  jsonOutput += readGasSensor();
  jsonOutput += ", \"rain\": ";
  jsonOutput += analogRead(rainSensor);

  jsonOutput += ", \"initialTime\": ";
  jsonOutput += initialTime;

  jsonOutput += "}]";

  Serial.println(jsonOutput);

  delay(1 * 1000);
}
