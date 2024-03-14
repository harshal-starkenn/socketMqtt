const pool = require("./db.js");

const tripsSocket = async (io) => {
  let connection = null;

  try {
    // socket connection
    io.on("connection", async (socket) => {
      let emitAndFetchFunction = async () => {
        try {
          const Query = `SELECT json_arrayagg(json_object('trip_id', TS.trip_id, 'startTime', TS.trip_start_time, 'device_id', TS.device_id, 'location_data', (SELECT json_arrayagg(json_object('latitude', td.lat, 'longitude', td.lng, 'speed', td.spd)) FROM TripData td WHERE td.trip_id = TS.trip_id ORDER BY td.timestamp ASC))) AS tripDetails FROM TripSummary TS WHERE TS.trip_status = 0`;

          connection = await pool.getConnection();

          const [results] = await connection.execute(Query);

          if (results && results.length && results[0].tripDetails) {
            let allTripIds = [];
            // Filter all trip IDs
            if (results[0].tripDetails.length) {
              results[0].tripDetails.map((item) => {
                allTripIds.push(item.trip_id);
              });

              // Emit to all the trip ID
              allTripIds.map((item) => {
                io.emit(
                  item,
                  results[0].tripDetails.filter((it) => it.trip_id === item)[0]
                );
              });
            }
          } else {
            console.log("There are no ongoing trips or an error occurred!");
          }
        } catch (err) {
          console.log("error in sending data to socket::", err);
        } finally {
          if (connection) {
            connection.release();
          }
        }
      };

      //Call function to emit data from database
      setInterval(() => {
        emitAndFetchFunction();
      }, 5000);
    });
  } catch (err) {
    console.log("error::", err);
  }
};

module.exports = { tripsSocket };
