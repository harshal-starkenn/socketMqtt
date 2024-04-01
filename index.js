const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const { client } = require("./mqtt");
const cors = require("cors");
const { tripsSocket } = require("./socketFunc");
const pool = require("./db.js");
const pool2 = require("./db2.js");

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server);
let connection1;
let connection2;
//connections
(async () => {
  connection2 = await pool2.getConnection();
  connection1 = await pool.getConnection();
})();

// send data from database through this
// tripsSocket(io);

const mqttTrigger = () => {
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
        // console.table([data, topic]);
        const parseData = JSON.parse(data);
        // https://5n6zcgmq7a.execute-api.ap-south-1.amazonaws.com/dev/validateJson
        axios
          .post("http://localhost:3000/dev/validateJson", { msg: data })
          .then((response) => {
            if (
              response.data &&
              parseData.device_id == response.data.device_id
            ) {
              const dataToEmit = {
                location_data: [
                  {
                    latitude: parseData.td.lat,
                    longitude: parseData.td.lng,
                    speed: parseData.td.spd,
                    timestamp: parseData.timestamp,
                  },
                ],
                tripSummaryDetails: [
                  {
                    event: parseData.event,
                    message: parseData.message,
                    device_id: parseData.device_id,
                    timestamp: parseData.timestamp,
                    latitude: parseData.td.lat,
                    longitude: parseData.td.lng,
                    speed: parseData.spd,
                    vehicle_id: response.data.vehicle_id,
                    tripID: response.data.trip_id,
                    jsonData: JSON.stringify(parseData),
                  },
                ],
                deviceHealth: [
                  {
                    cpu_load: parseData.device_health
                      ? parseData.device_health.cpu_load
                      : 0,
                    cpu_temp: parseData.device_health
                      ? parseData.device_health.cpu_temp
                      : 0,
                    memory: parseData.device_health
                      ? parseData.device_health.memory
                      : 0,
                    ignition: parseData.ignition ? parseData.ignition : 0,
                  },
                ],
              };
              console.log("Data Emmited!", parseData.device_id);
              io.emit(response.data.trip_id, dataToEmit);
            }
          })
          .catch((err) => {
            console.error(
              "Error::::::",
              err.response ? err.response.data : err
            );
          });
      } else {
        console.log("Received null message from MQTT");
      }
    } catch (err) {
      console.error("Error processing MQTT message:", err);
    }
  });
};

mqttTrigger();

// app.post("/mqtt", (req, res) => {
//   res.status(200).send("OK");
// });

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
