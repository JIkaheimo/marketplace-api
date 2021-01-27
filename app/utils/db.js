const mongoose = require("mongoose");

const { DB_URI } = require("./config");

connect = () =>
  mongoose
    .connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => console.log("Connected to MongoDB!"))
    .catch(err => console.log("Could not connect to MongoDB..."));

module.exports = {
  connect,
};
