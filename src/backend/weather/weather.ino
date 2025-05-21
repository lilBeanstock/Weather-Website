// Install these libraries below. Might have to be done in the Arduino IDE.
#include <DHT11.h>
#include <TimeLib.h>

DHT11 dht11(4);
#define gasSensor A0
// Rain sensor without water on it has a value of ~682.
// With a little bit of water: 336.
// Analog pin 1 seems to be a bit inaccurate? Changed to 5.
#define rainSensor A5
#define solarSensor A2
#define windSensor A3
#define buzzer 3

time_t initialTime;

double readSolarSensor() {
	int raw = analogRead(solarSensor);
	
	double a = 4.36E-6;
	double b = 0.00196;
	double c = -0.058;

	double y = a * pow(raw, 2) + b * raw + c;
	// Scale from 4.5 V (original solar panel) to 5.5 V.
	y *= 0.845;
	return max(0, min(y, 5.5));
}

double readWindSensor() {
	// Regression model to convert the analog value to m/s.
	int raw = analogRead(windSensor);
	double slope = (4.47 - 0) / (420 - 150);
	double yIntercept = -2.48333333333333333;
	
	if (raw < 150) return 0;
	return slope * raw + yIntercept;
}

void setup() {
  pinMode(gasSensor, INPUT);
  pinMode(rainSensor, INPUT);
  pinMode(solarSensor, INPUT);
  pinMode(windSensor, INPUT);
	pinMode(buzzer, OUTPUT);

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
  int result = dht11.readTemperatureHumidity(temperature, humidity);
	// The temperature is higher than it should be.
	temperature -= 4;

  jsonOutput += "{";

  jsonOutput += "\"temperature\": ";
  jsonOutput += result == 0 ? String(temperature) : "\"NaN\"";
  jsonOutput += ", \"humidity\": ";
  jsonOutput += result == 0 ? String(humidity) : "\"NaN\"";

	int gas = map(analogRead(gasSensor), 0, 1023, 0, 100);
  jsonOutput += ", \"gas\": ";
  jsonOutput += gas;

	int rain = map(analogRead(rainSensor), 0, 1023, 100, 0);
  jsonOutput += ", \"rain\": ";
  jsonOutput += rain;

	double solar = readSolarSensor();
	jsonOutput += ", \"solar\": ";
  jsonOutput += solar;

	double wind = readWindSensor(); 
	jsonOutput += ", \"wind\": ";
	jsonOutput += wind;

  jsonOutput += ", \"initialTime\": ";
  jsonOutput += initialTime;

	// No solar value check because the solar panel is too sensitive to sunlight (maxes out).
	bool shouldBuzz = (temperature >= 30) || (humidity >= 40) || (gas >= 75) || (rain >= 25) || (wind >= 4);
	shouldBuzz ? tone(buzzer, 1000) : noTone(buzzer);
	// Temporary LED.
	// digitalWrite(buzzer, shouldBuzz);

	jsonOutput += ", \"alarming\": ";
	jsonOutput += String(shouldBuzz);

  jsonOutput += "}";

  Serial.println(jsonOutput);

	
  delay(5 * 1000);
}
