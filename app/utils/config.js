//@ts-check

/**
 * This module contains environment specific (development, testing...)
 * parameter configurations.
 * @module utils/config
 */

import { config } from 'dotenv';
// Initialize (read from file) environmental variables.
config();

// Neat way to access all the defined environmental variables.
let {
  PORT,
  DB_URI,
  TEST_PORT,
  TEST_DB_URI,
  NODE_ENV,
  SECRET,
  SALT_ROUNDS,
} = process.env;

// Make sure salt rounds is numeric.
const SALT_ROUNDS_AS_NUM = +SALT_ROUNDS;

// Use different port and database for testing.
if (NODE_ENV == 'test') {
  DB_URI = TEST_DB_URI;
  PORT = TEST_PORT;
}

export { PORT };
export { DB_URI };
export { SECRET };
export { SALT_ROUNDS_AS_NUM as SALT_ROUNDS };

export default {
  PORT,
  DB_URI,
  SECRET,
  SALT_ROUNDS: SALT_ROUNDS_AS_NUM,
};
