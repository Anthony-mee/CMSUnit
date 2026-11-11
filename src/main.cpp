#include <Arduino.h>
#include <ArduinoJson.h>
#include <DallasTemperature.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char *DEVICE_ID = "esp32-sensor-01";
constexpr char WIFI_SSID[] = "rororor";
constexpr char WIFI_PASSWORD[] = "chynnamoreno";
constexpr char READINGS_ENDPOINT[] =
    "https://email-lets-yesterday-janet.trycloudflare.com/api/iot/readings";
constexpr char DEVICE_KEY[] =
    "20a431c413309b242a7540a6b3ab77c95df3e0e1bf627efdd0312d3a47175c1d";

// DS18B20 DATA -> GPIO 4 with a 4.7 kOhm pull-up to 3.3 V.
// MQ analog output -> GPIO 34 through suitable 3.3 V protection.
// HC-SR04 TRIG -> GPIO 5.
// HC-SR04 ECHO -> GPIO 18 through a voltage divider or level shifter.
constexpr uint8_t DS18B20_DATA_PIN = 4;
constexpr uint8_t MQ_ANALOG_PIN = 34;
constexpr uint8_t HC_SR04_TRIG_PIN = 5;
constexpr uint8_t HC_SR04_ECHO_PIN = 18;

constexpr unsigned long SAMPLE_INTERVAL_MS = 5000;
constexpr unsigned long ECHO_TIMEOUT_US = 30000;
constexpr float MIN_DISTANCE_CM = 2.0f;
constexpr float MAX_DISTANCE_CM = 400.0f;

OneWire oneWire(DS18B20_DATA_PIN);
DallasTemperature temperatureSensor(&oneWire);
unsigned long lastSampleAt = 0;

float readTemperatureC() {
  temperatureSensor.requestTemperatures();
  const float value = temperatureSensor.getTempCByIndex(0);

  if (value == DEVICE_DISCONNECTED_C || value < -55.0f || value > 125.0f) {
    return NAN;
  }
  return value;
}

int readMqAverage() {
  long total = 0;
  constexpr int sampleCount = 10;

  for (int index = 0; index < sampleCount; index++) {
    total += analogRead(MQ_ANALOG_PIN);
    delay(10);
  }

  return static_cast<int>(total / sampleCount);
}

float readDistanceCm() {
  digitalWrite(HC_SR04_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(HC_SR04_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(HC_SR04_TRIG_PIN, LOW);

  const unsigned long duration =
      pulseIn(HC_SR04_ECHO_PIN, HIGH, ECHO_TIMEOUT_US);
  if (duration == 0) {
    return NAN;
  }

  const float distance = duration * 0.0343f / 2.0f;
  if (distance < MIN_DISTANCE_CM || distance > MAX_DISTANCE_CM) {
    return NAN;
  }
  return distance;
}

void printReading(float temperatureC, int mqRaw, float distanceCm) {
  JsonDocument document;
  document["device_id"] = DEVICE_ID;

  if (isnan(temperatureC)) {
    document["temperature_c"] = nullptr;
  } else {
    document["temperature_c"] = temperatureC;
  }

  document["mq_raw"] = mqRaw;

  if (isnan(distanceCm)) {
    document["distance_cm"] = nullptr;
  } else {
    document["distance_cm"] = distanceCm;
  }

  serializeJson(document, Serial);
  Serial.println();
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("Connecting to Wi-Fi: %s\n", WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.printf("\nConnected. ESP32 IP: %s\n",
                WiFi.localIP().toString().c_str());
}

void sendReading(float temperatureC, int mqRaw, float distanceCm) {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  JsonDocument document;
  document["device_id"] = DEVICE_ID;
  if (isnan(temperatureC)) {
    document["temperature_c"] = nullptr;
  } else {
    document["temperature_c"] = temperatureC;
  }
  document["mq_raw"] = mqRaw;
  if (isnan(distanceCm)) {
    document["distance_cm"] = nullptr;
  } else {
    document["distance_cm"] = distanceCm;
  }
  document["recorded_at_ms"] = millis();

  String payload;
  serializeJson(document, payload);

  WiFiClientSecure secureClient;
  secureClient.setInsecure();
  HTTPClient http;
  if (!http.begin(secureClient, READINGS_ENDPOINT)) {
    Serial.println("Could not initialize HTTPS connection to the readings endpoint.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  const int status = http.POST(payload);
  Serial.printf("API response: %d\n", status);
  if (status > 0) {
    Serial.println(http.getString());
  } else {
    Serial.printf("HTTP error: %s\n", http.errorToString(status).c_str());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(HC_SR04_TRIG_PIN, OUTPUT);
  pinMode(HC_SR04_ECHO_PIN, INPUT);
  analogReadResolution(12);
  temperatureSensor.begin();

  connectToWiFi();
}

void loop() {
  if (millis() - lastSampleAt < SAMPLE_INTERVAL_MS) {
    delay(20);
    return;
  }

  lastSampleAt = millis();

  const float temperatureC = readTemperatureC();
  const int mqRaw = readMqAverage();
  const float distanceCm = readDistanceCm();

  printReading(temperatureC, mqRaw, distanceCm);
  sendReading(temperatureC, mqRaw, distanceCm);
}
