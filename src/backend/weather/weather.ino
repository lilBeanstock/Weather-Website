// Install these libraries below. Might have to be done in the Arduino IDE.
#include <DHT11.h>
#include <TimeLib.h>

// Define our temperature and humidity sensor as the object and connected to digital pin 4.
DHT11 dht11(4);
#define gasSensor A0
// Analog pin 1 seems to be a bit inaccurate? Changed to 5.
#define rainSensor A5
#define solarSensor A2
#define windSensor A3
#define buzzer 3

// The date and time when the weather station started storing data.
time_t initialTime;

// Converts the analog solar sensor value to a voltage.
double readSolarSensor() {
	int raw = analogRead(solarSensor);
	
	double a = 4.36E-6;
	double b = 0.00196;
	double c = -0.058;

	// Quadratic expression.
	double y = a * pow(raw, 2) + b * raw + c;
	// Scale from 4.5 V (original solar panel) to 5.5 V.
	y *= 0.845;
	return max(0, min(y, 5.5));
}

double readWindSensor() {
	// Linear regression model to convert the analog value to a velocity (meters per second).
	int raw = analogRead(windSensor);
	double slope = (4.47 - 0) / (420 - 150);
	double yIntercept = -2.48333333333333333;
	
	if (raw < 150) return 0;
	return slope * raw + yIntercept;
}

void setup() {
	// Define what components send data to us and which ones we send data to.
  pinMode(gasSensor, INPUT);
  pinMode(rainSensor, INPUT);
  pinMode(solarSensor, INPUT);
  pinMode(windSensor, INPUT);
	pinMode(buzzer, OUTPUT);

	// Print to serial monitor at baud rate 9600.
  Serial.begin(9600);

	// Store/Send the time of when the weather staton began operation.
  tmElements_t tm;

	// 2025-04-30 13:16:00
  tm.Year = CalendarYrToTm(2025);
  tm.Month = 4;
  tm.Day = 30;
  tm.Hour = 13;
  tm.Minute = 16;
  tm.Second = 0;

  initialTime = makeTime(tm);
}

void loop() {
	// We return the JSON object at the end as a serial output. This is the starting character.
  String jsonOutput = "{";
  
  int temperature = 0;
  int humidity = 0;
	// Reassign the values above to the values given by the DHT11.
  int result = dht11.readTemperatureHumidity(temperature, humidity);
	// The temperature is higher than it should be so we subtract a few degrees Celsius.
	temperature -= 4;

	// Add the values to the JSON object/output.
  jsonOutput += "\"temperature\": ";
	// Return NaN (not a number) if the sensor did not return valid data (e.g. failed).
  jsonOutput += result == 0 ? String(temperature) : "\"NaN\"";
  jsonOutput += ", \"humidity\": ";
  jsonOutput += result == 0 ? String(humidity) : "\"NaN\"";

	// Value range of 0 to 1023 but we want a percentage of 0% to 100%.
	int gas = map(analogRead(gasSensor), 0, 1023, 0, 100);
  jsonOutput += ", \"gas\": ";
  jsonOutput += gas;

	// Same as above but the opposite way (100% to 0%).
	int rain = map(analogRead(rainSensor), 0, 1023, 100, 0);
  jsonOutput += ", \"rain\": ";
  jsonOutput += rain;

	double solar = readSolarSensor();
	jsonOutput += ", \"solar\": ";
  jsonOutput += solar;

	double wind = readWindSensor(); 
	jsonOutput += ", \"wind\": ";
	jsonOutput += wind;

	// Add the time of first storage to the output.
  jsonOutput += ", \"initialTime\": ";
  jsonOutput += initialTime;

	// No solar value check because the solar panel is too sensitive to sunlight (maxes out).
	// The alarm should buzz if any component value/weather condition is deemed too high/unsafe.
	bool shouldBuzz = (temperature >= 30) || (humidity >= 40) || (gas >= 80) || (rain >= 25) || (wind >= 4);
	shouldBuzz ? tone(buzzer, 1000) : noTone(buzzer);

	jsonOutput += ", \"alarming\": ";
	// 1: true, 0: false.
	jsonOutput += String(shouldBuzz);

	// End of our JSON object which we will send.
  jsonOutput += "}";

	// Print the JSON object to the serial monitor so we can read it through our web server.
  Serial.println(jsonOutput);

	// Wait 5 seconds before reading the values again.
  delay(5 * 1000);
}
