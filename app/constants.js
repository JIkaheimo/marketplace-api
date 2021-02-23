//@ts-check

/**
 * This module contains some constants used for
 * both the tests and the application itself.
 * @module constants
 */

export const API_ROOT = '/api';
export const POSTS_PATH = `${API_ROOT}/posts`;
export const LOGIN_PATH = `${API_ROOT}/login`;
export const USERS_PATH = `${API_ROOT}/users`;
export const IMAGES_PATH = `${API_ROOT}/images`;

export const badRequest = {
  message: 'Invalid request body',
  code: 400,
  strCode: '400',
};

export const unauthorized = {
  message: 'Unauthorized',
  code: 401,
  strCode: '401',
};

export const forbidden = {
  message: 'Access Forbidden',
  code: 403,
  strCode: '403',
};

export const notFound = {
  message: 'Not Found',
  code: 404,
  strCode: '404',
};

export const conflict = {
  code: 409,
  strCode: '409',
};

export const server = {
  message: 'Something went wrong :(',
  code: 500,
  strCode: '500',
};

export const errors = {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  server,
};
