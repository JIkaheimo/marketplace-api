import bcrypt from 'bcrypt';
import { Router } from 'express';
import { User } from '../models/index.js';
import { hash } from '../utils/auth.js';
import { validateUser } from '../utils/middleware.js';

const usersRouter = Router();

// Create a new user
usersRouter.post(
  '/',
  [validateUser, hash],
  async ({ parsed, passwordHash }, res, next) => {
    // Make sure not to store the password.
    const { password, ...userInfo } = parsed;
    // Create a new User model.
    const user = new User({
      ...userInfo,
      passwordHash,
      creationDate: new Date().toISOString().split('T')[0],
    });
    // Save the user.
    const savedUser = await user.save();
    // Return the newly created user and token.
    res.json({ user: savedUser, token: savedUser.token });
  }
);

export default usersRouter;
