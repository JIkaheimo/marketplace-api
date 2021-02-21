import mongoose from 'mongoose';
import faker from 'faker';
import supertest from 'supertest';
import app from '../server.js';
import { ERRORS } from '../constants.js';

const { notFound } = ERRORS;

const api = supertest(app);

describe('when requesting non-existing path', () => {
  it('should return a response type of 404 (Not Found) with correct message.', async () => {
    await api
      .get('/api/')
      .send()
      .expect(notFound.code)
      .expect({ message: notFound.message });
  });
});

after('Close DB connection.', () => {
  mongoose.connection.close();
});
