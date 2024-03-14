const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const { client } = require("./mqtt");
const cors = require("cors");
const { tripsSocket } = require("./socketFunc");

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server);

// send data from database through this
tripsSocket(io);

client.on("connect", () => {
  console.log("Connected to MQTT!");
  //starkennInv3/${row.device_id}/data
  client.subscribe(`#`, (err) => {
    if (err) {
      console.error("Error in subscribing to topic:", err);
    } else {
      console.log("Subscribed to the topic");
    }
  });
});

client.on("message", (topic, message) => {
  try {
    if (message) {
      let data = message.toString();
      console.table([data, topic]);
      // https://5n6zcgmq7a.execute-api.ap-south-1.amazonaws.com/dev/validateJson
      axios
        .post(
          "https://5n6zcgmq7a.execute-api.ap-south-1.amazonaws.com/dev/validateJson",
          { msg: data }
        )
        .then((response) => {
          console.log("API Response:", response.data.message);
        })
        .catch((err) => {
          console.error("Error::::::", err.response.data);
        });
    } else {
      console.log("Received null message from MQTT");
    }
  } catch (err) {
    console.error("Error processing MQTT message:", err);
  }
});

app.post("/mqtt", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
