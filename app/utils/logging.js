/**
 * This module contains some logging specific
 * functions.
 *
 * @module utils/logging
 */

export const i = (...params) =>
  process.env.NODE_ENV !== 'test' ? console.log(...params) : null;

export const e = (...params) => console.log(...params);
