const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const { User } = require("../models");

const SALT_ROUNDS = 10;

const getRequiredFields = ({
  email,
  username,
  address,
  phoneNumber,
  birthDate,
}) => ({ email, username, address, phoneNumber, birthDate });

// Create a new user
usersRouter.post("/", async ({ body }, res, next) => {
  const { password } = body;
  if (!password) res.status(400).json({ message: "Malformatted data." });
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = new User({
    creationDate: new Date().toISOString().split("T")[0],
    passwordHash,
    ...getRequiredFields(body),
  });

  const savedUser = await user.save();

  res.json(savedUser);
});

module.exports = usersRouter;
