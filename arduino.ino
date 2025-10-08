// arduino.ino
#include <DHT.h>
#define DHTPIN 2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t)) {
    Serial.print("{\"temperatura\":");
    Serial.print(t);
    Serial.print(",\"umidade\":");
    Serial.print(h);
    Serial.println("}");
  } else {
    Serial.print("{\"erro\":true}");
  }
  delay(2000);
}
