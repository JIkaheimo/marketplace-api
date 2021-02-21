/**
 * This module contains some logging specific
 * helper functions and middleware.
 */

export const i = (...params) =>
  process.env.NODE_ENV !== 'test' ? console.log(...params) : null;

export const e = (...params) => console.log(...params);

export default {
  i,
  e,
};
