const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginRouter = require("express").Router();

const User = require("../models/user");

// Authenticate user.
loginRouter.post("/", async ({ body }, res) => {});

module.exports = loginRouter;
