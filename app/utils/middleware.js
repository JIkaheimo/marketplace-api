//@ts-check

/**
 * This module contains some commonly used middlewares.
 * @module utils/middleware
 */

import { ERRORS } from '../constants.js';
import { loginParser, postParser, userParser } from './bodyParser.js';
import { badRequestError } from './errors.js';

const {
  unauthorized,
  forbidden,
  badRequest,
  notFound,
  conflict,
  server,
} = ERRORS;

/**
 * Creates a simple body validator that checks the request body
 * for any extranous fields and responses with error
 * if there are any.
 * @param {import('../types.js').BodyParser} parser
 * @returns {import('express').RequestHandler}
 */
const bodyValidator = parser => (req, _, next) => {
  // Parse request boy.
  const { extras, ...fields } = parser(req.body);
  // Return bad request if there are extra any fields.
  if (Object.keys(extras).length) next(badRequestError());
  // Add parsed request body to requet.
  req['parsed'] = fields;
  // Call the next middleware.
  next();
};

/**
 * Simple body validator middleware for requests with post data.
 */
export const validatePost = bodyValidator(postParser);

/**
 * Simple body validator middleware for requests with user data.
 */
export const validateUser = bodyValidator(userParser);

/**
 * Simple body validator middleware for requests with login data.
 */
export const validateLogin = bodyValidator(loginParser);

/**
 * Simple middleware to get the full url of the request.
 * @type {import('express').RequestHandler}
 */
export const pathProvider = (req, res, next) => {
  req['hostPath'] = `${req.protocol}://${req.get('host')}`;
  req['fullPath'] = `${req['hostPath']}${req.originalUrl}`;
  next();
};

/**
 * Error handler.
 * @type {import('express').ErrorRequestHandler}
 * @param {Error|Object} error;
 */
export const errorHandler = (error, _, res, next) => {
  // Add any error specific handler code here.
  switch (error.name) {
    // Triggers when MongoDB gets invalid data.
    case 'ValidationError':
      const errorFields = Object.keys(error.errors);
      const firstError = error.errors[errorFields[0]];

      switch (firstError.kind) {
        // Triggers when the user tries to create an account with
        // already existing login credentials.
        case 'unique':
          res
            .status(conflict.code)
            .json({ message: `${firstError.path} already in use` });
          break;
        // Missing fields.
        default:
          res.status(badRequest.code).json({ message: badRequest.message });
          break;
      }
      break;
    // Triggers when the user tries to upload invalid amount of files,
    // invalid fields or invalid type of files.
    case 'MulterError':
    // Triggers when there is some extanous fields in request.
    case 'StrictModeError':
    // Triggers for invalid data format.
    case 'SyntaxError':
    // Triggers for invalid request body.
    case badRequest.strCode:
      res.status(badRequest.code).json({ message: badRequest.message });
      break;
    // Triggers when JSON web token cannot be fetched.
    case 'JsonWebTokenError':
    // User is not authenticated.
    case unauthorized.strCode:
      res.status(unauthorized.code).json({ message: unauthorized.message });
      break;
    // Triggers when MongoDB tries to use invalid ID or cannot convert.
    case 'CastError':
      // Invalid datatype in body...
      if (!error.message.startsWith('Cast to ObjectId')) {
        res.status(badRequest.code).json({ message: badRequest.message });
        break;
      }
    // Nonexisting resource/path.
    case notFound.strCode:
      res.status(notFound.code).json({ message: notFound.message });
      break;
    // Unauthorized user.
    case forbidden.strCode:
      res.status(forbidden.code).json({ message: forbidden.message });
      break;
    // Unknown erros.
    default:
      console.log(error.name);
      console.log(error.message);
      res.status(server.code).json({ message: server.message });
  }

  next(error);
};

/**
 * Handles unknown API endpoints.
 * @type {import('express').RequestHandler}
 */
export const unknownHandler = (_, res) => {
  res.status(notFound.code).send({ message: notFound.message });
};
