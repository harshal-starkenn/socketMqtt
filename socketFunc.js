const tripsSocket = async (io, deviceID, connection1, connection2) => {
  try {
    let fetchTripDetailsQuery = `SELECT json_arrayagg(json_object('trip_id',TS.trip_id,'device_id',TS.device_id,'startTime',TS.trip_start_time,'vehicle_id',TS.vehicle_id,'tripStatus',TS.trip_status)) AS tripSummaryDetails FROM TripSummary TS WHERE TS.trip_status=0;`;

    const [tripResults] = await connection1.execute(fetchTripDetailsQuery);

    if (
      tripResults &&
      tripResults.length &&
      tripResults[0].tripSummaryDetails
    ) {
      const tripsummarydetails = tripResults[0].tripSummaryDetails;

      let allData = await Promise.all(
        tripsummarydetails.map(async (el) => {
          //inside the map function

          let tripData = `SELECT json_arrayagg(json_object('location_data',(SELECT json_arrayagg(json_object('latitude',td.lat,'longitude',td.lng,'speed',td.spd,'tripID',td.trip_id)) FROM TripData td WHERE td.trip_id ='${el.trip_id}' ORDER BY td.timestamp ASC),'alerts',(SELECT json_arrayagg(json_object('event',TD.event,'message',TD.message,'device_id',TD.device_id,'timestamp',TD.timestamp,'latitude',TD.lat,'longitude',TD.lng,'spd',TD.spd,'vehicle_id',TD.vehicle_id,'jsonData',TD.jsonData,'tripID',TD.trip_id)) FROM TripData TD WHERE TD.trip_id = '${el.trip_id}' AND TD.event NOT IN ('IGS', 'LOC')))) AS tripDetails;`;

          const [tripSummData] = await connection2.execute(tripData);

          let oneTripData = { ...el, ...tripSummData[0].tripDetails[0] };
          return oneTripData;
        })
      ); //end of map func

      allData.map((el) => {
        io.emit(el.trip_id, el);
      });
    } else {
      console.log("No ongoing trips or an error occurred!");
    }

    // console.log("TripResults", tripResults[0].tripSummaryDetails);
  } catch (err) {
    console.log("Error", err);
  }
};

module.exports = { tripsSocket };
