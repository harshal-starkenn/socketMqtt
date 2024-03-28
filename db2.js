const mysql = require("mysql2/promise");

const pool2 = mysql.createPool({
  host: "serverless-tripdata.cuce9do7mxez.ap-south-1.rds.amazonaws.com",
  user: "admin",
  password: "serverlesstrip",
  database: "serverless_tripdata",
  waitForConnections: true,
  multipleStatements: true,
});

// Add a listener for the 'connection' event
pool2.on("connection", (connection) => {
  console.log("TripData Database connected");
  connection.on("end", () => {
    console.log("TripData Database connection released");
  });
});

// Add a listener for the 'error' event
pool2.on("error", (err) => {
  console.log(`TripData Database error: ${err}`);
});

module.exports = pool2;
