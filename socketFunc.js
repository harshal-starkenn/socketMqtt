const pool = require("./db.js");

const tripsSocket = async (io, deviceID) => {
  let connection = null;

  try {
    let emitAndFetchFunction = async () => {
      try {
        const Query = `SELECT json_arrayagg(json_object('trip_id', TS.trip_id, 'startTime', TS.trip_start_time, 'device_id', TS.device_id, 'location_data', (SELECT json_arrayagg(json_object('latitude', td.lat, 'longitude', td.lng, 'speed', td.spd)) FROM TripData td WHERE td.trip_id = TS.trip_id ORDER BY td.timestamp ASC), 'alerts', (SELECT json_arrayagg(json_object('event', TD.event, 'message', TD.message, 'device_id', TD.device_id, 'timestamp', TD.timestamp, 'latitude', TD.lat, 'longitude', TD.lng, 'spd', TD.spd, 'vehicle_id', TD.vehicle_id, 'jsonData', TD.jsonData)) FROM TripData TD WHERE TD.trip_id = TS.trip_id AND TD.event NOT IN ('IGS', 'LOC')))) AS tripDetails FROM TripSummary TS WHERE TS.trip_status = 0;`;

        connection = await pool.getConnection();

        const [results] = await connection.execute(Query);

        if (connection) {
          connection.release();
        }

        if (results && results.length && results[0].tripDetails) {
          let allTripIds = [];
          // Filter all trip IDs
          if (results[0].tripDetails.length) {
            results[0].tripDetails.map((item) => {
              if (item.device_id === deviceID) {
                // console.log("coming device", deviceID);
                allTripIds.push(item.trip_id);
              }
            });

            // Emit to all the trip ID
            allTripIds.map((item) => {
              // console.log("tripDetails:::", results[0].tripDetails);
              // if(results[0].tripDetails.device_id)
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
    emitAndFetchFunction();
  } catch (err) {
    console.log("error::", err);
  }
};

module.exports = { tripsSocket };
