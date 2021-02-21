//@ts-check

import { ERRORS } from '../constants.js';

/** @typedef {(string?) => import('../types.js').ResponseError} ErrorCreator   */

/**
 * Simple function to return a simple error creator
 * for the given error type.
 * @param {import('../types.js').ErrorType} errorType
 * @returns {ErrorCreator}
 */
const errorCreator = errorType => (message = errorType.message) => {
  const { strCode } = errorType;
  const error = new Error(message);
  error.name = strCode;
  return error;
};

/** @type {ErrorCreator} */
export const badRequestError = errorCreator(ERRORS.badRequest);

/** @type {ErrorCreator} */
export const unauthorizedError = errorCreator(ERRORS.unauthorized);

/** @type {ErrorCreator} */
export const forbiddenError = errorCreator(ERRORS.forbidden);

/** @type {ErrorCreator} */
export const notFoundError = errorCreator(ERRORS.notFound);

export default {
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
};
