/**
 * This module contains some authentication/authorization
 * related helper functions and middleware.
 * @module utils/auth
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { errors, config } from './index.js';

/**
 * Returns a JSON webtoken from the given request.
 *
 * @middleware
 * @param {import('express').Request} req The request.
 * @returns {string} JSON web token.
 */
export const getToken = req => {
  // Get the authorization header field.
  const authHeader = req.get('Authorization');

  const token =
    // Make sure auth header exists.
    authHeader &&
    // Check for bearer auth type.
    authHeader.toLowerCase().startsWith('bearer') &&
    // Get the token (string after bearer)
    authHeader.substring(7);

  return token;
};

/**
 * Middleware to check if there is a bearer token in request.
 *
 * @middleware
 * @param {import('express').Request} req The request.
 * @param {import('express').Response} _ The response.
 * @param {import('express').NextFunction} next
 */
export const checkToken = (req, _, next) => {
  const token = getToken(req);
  // Verify token.
  const decodedToken = jwt.verify(token, process.env.SECRET);
  const { username, id } = decodedToken;
  console.log(decodedToken);
  // Add parsed token data to request.
  req.username = username;
  req.userId = id;

  // Call next middleware.
  next();
};

/**
 * Middleware to make sure the client is authenticated.
 */
export const authenticate = checkToken;

/**
 * Middleware to hash the user password from the given request.
 *
 * @middleware
 * @param {import('express').Request} req The request.
 * @param {import('express').Response} _ The response.
 * @param {import('express').NextFunction} next
 */
export const hash = async (req, _, next) => {
  const { password } = req.body;
  // Make sure password is present.
  if (!password) next(errors.badRequestError());
  // Hash the password.
  req['passwordHash'] = await bcrypt.hash(password, config.SALT_ROUNDS);
  // Call next middleware.
  next();
};

export default {
  authenticate: checkToken,
  getToken,
  checkToken,
  hash,
};
