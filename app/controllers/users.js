const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/user");

const SALT_ROUNDS = 10;

// Create a new user
usersRouter.post("/", async ({ body }, res, next) => {
  const { password, username } = body;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = new User({
    passwordHash,
    username,
  });

  const savedUser = await user.save();

  res.json(savedUser);
});

module.exports = usersRouter;
