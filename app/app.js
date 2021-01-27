require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const morgan = require("morgan");

const { connect } = require("./utils/db");

const postsRouter = require("./controllers/posts");
const loginRouter = require("./controllers/login");
const usersRouter = require("./controllers/users");

const app = express();

connect();

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(morgan("tiny"));

app.use("/api/posts", postsRouter);
app.use("/api/login", loginRouter);
app.use("/api/users", usersRouter);

app.use((req, res) => {
  res.status(404).send({ message: "unknown endpoint" });
});

app.use((error, req, res, next) => {
  switch (error.name) {
    case "CastError":
      res.status(400).json({ message: "Malformatted id" });
    case "ValidationError":
      res.status(400).json({ message: error.message });
  }

  next(error);
});

module.exports = app;
