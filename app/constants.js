//@ts-check

/**
 * This module contains some constants used for
 * both the tests and the application itself.
 * @module constants
 */

/**
 * The API root path.
 * @constant
 * @type {string}
 */
export const API_ROOT = '/api';

export const ERRORS = {
  badRequest: {
    message: 'Invalid request body',
    code: 400,
    strCode: '400',
  },
  unauthorized: {
    message: 'Unauthorized',
    code: 401,
    strCode: '401',
  },
  forbidden: {
    message: 'Access Forbidden',
    code: 403,
    strCode: '403',
  },
  notFound: {
    message: 'Not Found',
    code: 404,
    strCode: '404',
  },
  conflict: {
    code: 409,
    strCode: '409',
  },
  server: {
    message: 'Something went wrong :(',
    code: 500,
    strCode: '500',
  },
};

export default {
  API_ROOT,
  ERRORS,
};
