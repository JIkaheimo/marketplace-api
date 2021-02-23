import { Router } from 'express';
import { User } from '../models/index.js';
import { hash } from '../utils/auth.js';

const usersRouter = Router();

// Create a new user
usersRouter.post(
  '/',
  [
    hash, // Make sure to hash the password.
  ],
  async ({ body, passwordHash }, res) => {
    // Make sure not to store the password.
    const { password, ...userInfo } = body;
    // Create a new User model.
    const user = new User(
      {
        ...userInfo,
        passwordHash,
        creationDate: new Date().toISOString().split('T')[0],
      },
      true
    );
    // Save the user.
    const savedUser = await user.save();

    // Return the newly created user and token.
    res.json({ user: savedUser, token: savedUser.token });
  }
);

export default usersRouter;
