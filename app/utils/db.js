const mongoose = require("mongoose");

const log = require("./logging");
const { DB_URI } = require("./config");

connect = () => {
  log.i("Connecting to MongoDB...");
  mongoose
    .connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => log.i("Connected to MongoDB!"))
    .catch(err => log.e("Could not connect to MongoDB..."));
};

module.exports = {
  connect,
};
