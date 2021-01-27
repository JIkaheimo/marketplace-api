require("dotenv").config();

const express = require("express");
const morgan = require("morgan");

const { connect } = require("./utils/db");
const { errorHandler, unknownHandler } = require("./utils/middleware");

const { login, users, posts } = require("./controllers");

const app = express();

connect(() => app.emit("ready"));

app.use(express.json());
app.use(express.static("public"));
app.use(morgan("tiny"));

app.use("/api/posts", posts);
app.use("/api/login", login);
app.use("/api/users", users);

app.use(unknownHandler);
app.use(errorHandler);

module.exports = app;
