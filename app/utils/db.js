//@ts-check

/**
 * This module contains functions
 * to manage the connection with the MongoDB.
 *
 * @module utils/db
 */

import mongoose from 'mongoose';

import { logger, config } from './index.js';

export const connect = callback => {
  logger.i('Connecting to MongoDB...');
  mongoose
    .connect(config.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => {
      logger.i('Connected to MongoDB!');
      callback();
    })
    .catch(_ => logger.e('Could not connect to MongoDB...'));
};

export default {
  connect,
};
