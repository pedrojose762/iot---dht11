// INSTALAR DEPENDÊNCIAS:
// npm install serialport @serialport/parser-readline mqtt

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const mqtt = require('mqtt');

// CONFIGURAÇÕES
const SERIAL_PORT = "COM3"; // Substitua pela porta do seu Arduino
const BAUD_RATE = 9600;
const MQTT_BROKER = "mqtt://test.mosquitto.org";
const MQTT_TOPIC_DATA = "home/sensors/dht11";
const MQTT_TOPIC_CMD  = "home/sensors/dht11/cmd";

// INICIALIZAÇÃO SERIAL
const port = new SerialPort(SERIAL_PORT, { baudRate: BAUD_RATE });
const parser = port.pipe(new Readline({ delimiter: "\n" }));

// INICIALIZAÇÃO MQTT
const client = mqtt.connect(MQTT_BROKER);

let sensorOn = false;

// CONECTAR AO BROKER MQTT
client.on("connect", () => {
  console.log("🟢 Conectado ao broker MQTT");
  client.subscribe(MQTT_TOPIC_CMD, (err) => {
    if(err) console.log("Erro ao se inscrever no tópico de comando:", err);
  });
});

// RECEBENDO COMANDOS DO DASHBOARD
client.on("message", (topic, message) => {
  if(topic === MQTT_TOPIC_CMD){
    const cmd = message.toString().trim().toUpperCase();
    if(cmd === "ON" || cmd === "OFF"){
      sensorOn = cmd === "ON";
      console.log(`⚡ Sensor ${sensorOn ? "Ligado" : "Desligado"}`);
    }
  }
});

// LENDO DADOS DO ARDUINO
parser.on("data", (data) => {
  const trimmed = data.trim();
  if(sensorOn){
    // Espera formato TEMP:xx.x,HUM:xx.x
    if(trimmed.includes("TEMP:") && trimmed.includes("HUM:")){
      client.publish(MQTT_TOPIC_DATA, trimmed);
      console.log("📤 Enviado para MQTT:", trimmed);
    }
  } else {
    console.log("⏸ Sensor desligado, dados ignorados.");
  }
});

port.on("error", (err) => console.error("Erro na porta serial:", err));
client.on("error", (err) => console.error("Erro MQTT:", err));
