//@ts-check

import mongoose from 'mongoose';
import supertest from 'supertest';
import { default as chai } from 'chai';
const { expect } = chai;

import app from '../server.js';
import { usersInDb, initialUsers, getNewUser, createUsers } from './helpers.js';
import { ERRORS } from '../constants.js';
import { login, removeField } from './data.js';
import { User } from '../models/user.js';
const { badRequest, unauthorized } = ERRORS;

const api = supertest(app);

const loginReq = (body, { message = null, code }) => {
  const req = api.post('/api/login').send(body).expect(code);
  if (message) req.expect({ message });
  return req;
};

describe('when there is one user in the database', () => {
  //
  beforeEach(async () => {
    await createUsers(initialUsers);
  });

  /*************************
   ** CREATING A NEW USER **
   *************************/
  describe('POST /api/users', () => {
    /*
     * FOR VALID DATA
     */
    describe('with valid data', () => {
      it('should create a new user', async () => {
        // Get the users in the beginning.
        const usersAtStart = await usersInDb();
        // Create a new random user.
        const newUser = getNewUser();
        // Create the user.
        const req = await api
          .post('/api/users')
          .send(newUser)
          .expect(200)
          .expect('Content-Type', /application\/json/);

        it('should return a body with the sent user info.', () => {
          expect(req.body).to.deep.contain(newUser);
        });

        // Get the modified users.
        const usersAtEnd = await usersInDb();
        // Check if the amount of users was increased.
        expect(usersAtEnd).to.have.length(usersAtStart.length + 1);
        // Check if the users
        const usernames = usersAtEnd.map(u => u.username);
        expect(usernames).to.contain(newUser.username);
      });
    });
    /*
     * FOR INVALID DATA
     */
    describe('with invalid data', () => {
      //
      it('should not create a new user if username is already in use.', async () => {
        const newUser = getNewUser();
        await api.post('/api/users').send(newUser);
        const usersAtStart = await usersInDb();

        await api
          .post('/api/users')
          .send({ ...newUser, email: 'testaaja@gmail.com' })
          .expect(409)
          .expect('Content-Type', /application\/json/)
          .expect({ message: 'username already in use' });

        const usersAtEnd = await usersInDb();
        expect(usersAtEnd).to.have.length(usersAtStart.length);
      });

      it('should not create a new user if email is already in use.', async () => {
        const newUser = getNewUser();
        await api.post('/api/users').send(newUser);
        const usersAtStart = await usersInDb();

        await api
          .post('/api/users')
          .send({ ...newUser, username: 'Testaaja123' })
          .expect(409)
          .expect('Content-Type', /application\/json/)
          .expect({ message: 'email already in use' });

        const usersAtEnd = await usersInDb();
        expect(usersAtEnd).to.have.length(usersAtStart.length);
      });
    });
  });

  /************************************
   ** AUTHENTICATING AN EXISTING USER **
   ************************************/
  describe('POST /api/login', () => {
    let user = initialUsers[0];
    let validCredentials = login();
    console.log(user);
    let userCredentials = { username: user.username, password: user.password };

    // Invalid request body.
    it('should return 400 for invalid request body', async () => {
      await loginReq({ random: 'random' }, badRequest);
      await loginReq({ ...removeField(validCredentials) }, badRequest);
      await loginReq({ ...validCredentials, username: 123 }, badRequest);
      await loginReq({ ...validCredentials, password: 123 }, badRequest);
    });
    // Invalid login credentials.
    it('should return 401 for invalid login credentials', async () => {
      await loginReq(
        { username: 'Hacker', password: 'hackerman' },
        unauthorized
      );
    });

    // Valid login credentials.
    it('should return bearer token for valid login credentials', async () => {
      const { body } = await loginReq(userCredentials, { code: 200 });
      expect(body).to.have.property('token');
      expect(body).to.have.property('user');
      const user = await User.findById(body.user.id);
      expect(body.user).to.eql(user.toJSON());
    });
  });
});

after('Close DB connection.', () => {
  mongoose.connection.close();
});
