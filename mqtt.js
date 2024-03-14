const mqtt = require("mqtt");

// MQTT creds
let host = "app.starkenn.com";
let port = "1883";
let clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

let connectUrl = `mqtt://${host}:${port}`;

// Connect to MQTT server
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: "starkenn",
  password: "semicolon",
  reconnectPeriod: 1000,
});

// Function to end the MQTT connection
function endConnection() {
  if (client && client.connected) {
    client.end();
    console.info("Disconnected from MQTT broker");
  } else {
    console.error("MQTT client is not connected");
  }
}

module.exports = { client, endConnection };
