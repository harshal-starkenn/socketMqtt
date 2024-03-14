const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "database-1.cuce9do7mxez.ap-south-1.rds.amazonaws.com",
  user: "admin",
  password: "Starkenn1199",
  database: "m3",
  waitForConnections: true,
  multipleStatements: true,
});

// Add a listener for the 'connection' event
pool.on("connection", (connection) => {
  console.log("Database connected");
  connection.on("end", () => {
    console.log("Database connection released");
  });
});

// Add a listener for the 'error' event
pool.on("error", (err) => {
  console.log(`Database error: ${err}`);
});

module.exports = pool;
