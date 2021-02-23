//@ts-check

/**
 * Routing/Controller module for hanling authentication/login
 * related requests.
 * @module controllers/login
 */

// Third-party modules.
import bcrypt from 'bcrypt';
import { Router } from 'express';

// In-house modules.
import { User } from '../models/index.js';
import { errors, mware } from '../utils/index.js';

/**
 * Login router.
 * @type {Router}
 */
const loginRouter = Router();

// [POST] Login/Authenticate an user.
loginRouter.post(
  '/',
  [mware.validateLogin],
  async ({ body: { username, password } }, res, next) => {
    // Validate username and password type.
    if (typeof username !== 'string' || typeof password !== 'string')
      next(errors.badRequestError());
    // Fetch user by the given username.
    const user = await User.findOne({ username });
    // Check if the user provided correct password.
    const passwordCorrect =
      user === null ? false : await bcrypt.compare(password, user.passwordHash);
    // Make sure the user exists and password is correct.
    if (!(user && passwordCorrect)) next(errors.unauthorizedError());
    // Return access token and user data.
    res.status(200).send({ token: user.token, user: user });
  }
);

export default loginRouter;
