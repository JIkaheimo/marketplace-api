require("dotenv").config();
const express = require("express");
require("express-async-errors");
const morgan = require("morgan");

const { connect } = require("./utils/db");
const { errorHandler, unknownHandler } = require("./utils/middleware");

const { login, users, posts } = require("./controllers");

const app = express();

connect(() => app.emit("ready"));

app.use(express.json());
app.use(express.static("public"));
process.env.NODE_ENV !== "test" ? app.use(morgan("tiny")) : null;

app.use("/api/posts", posts);
app.use("/api/login", login);
app.use("/api/users", users);

app.use(unknownHandler);
app.use(errorHandler);

module.exports = app;
