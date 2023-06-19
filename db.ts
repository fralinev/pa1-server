const { Client } = require("pg");

const client = new Client({
  user: "e",
  host: "localhost",
  database: "pa1",
  port: 5432,
});

client.connect();

module.exports = client;
