require("dotenv").config();

let { PORT, DB_URI, TEST_PORT, TEST_DB_URI, NODE_ENV } = process.env;

if (NODE_ENV == "test") {
  DB_URI = TEST_DB_URI;
  PORT = TEST_PORT;
}

module.exports = {
  PORT,
  DB_URI,
};
