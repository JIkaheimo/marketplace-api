//@ts-check

import { default as chai } from 'chai';
const { expect } = chai;

import supertest from 'supertest';
import app from '../server.js';
import { notFound } from '../constants.js';

const api = supertest(app);

describe('when requesting non-existing path', () => {
  beforeEach(() => {});

  it('should return a response type of 404 (Not Found) with correct message.', async () => {
    await api
      .get('/api/')
      .send()
      .expect(notFound.code)
      .expect({ message: notFound.message });
  });
});
