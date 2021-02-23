//@ts-check

import mongoose from 'mongoose';
import supertest from 'supertest';
import { default as chai } from 'chai';
const { expect } = chai;

import app from '../server.js';
import {
  usersInDb,
  otherUsers,
  getNewUser,
  createUsers,
  getToken,
  owner,
} from './helpers.js';
import { badRequest, unauthorized } from '../constants.js';
import { login, removeField } from './data.js';
import { User } from '../models/user.js';

const api = supertest(app);

describe('While handling user requests', () => {
  let usersAtStart = null;

  beforeEach('Create users', async () => {
    await createUsers([owner, ...otherUsers]);
  });

  beforeEach('Get created users', async () => {
    usersAtStart = await usersInDb();
  });

  /*************************
   ** CREATING A NEW USER **
   *************************/
  describe('[POST /api/users] Creating a new user', () => {
    // Valid data.
    describe('with valid data', () => {
      it('should create a new user', async () => {
        // Create a new random user.
        const newUser = getNewUser();
        const { password, ...userProps } = newUser;
        // Create the user.
        const req = await api.post('/api/users').send(newUser).expect(200);
        // Make sure everything was returned.
        expect(req.body.user).to.deep.include(userProps);
        expect(req.body.token).to.be.a('string');

        // Get the modified users.
        const usersAtEnd = await usersInDb();
        // Check if the amount of users was increased.
        expect(usersAtEnd).to.have.length(usersAtStart.length + 1);
        // Check if the users have the new user.
        const usernames = usersAtEnd.map(u => u.username);
        expect(usernames).to.contain(newUser.username);
      });
    });

    // With invalid data.
    describe('with invalid data', () => {
      // Username in use.
      it('should not create a new user if username is already in use.', async () => {
        // Increments users by one.
        const newUser = getNewUser();
        await api.post('/api/users').send(newUser);

        await api
          .post('/api/users')
          .send({ ...newUser, email: 'testaaja@gmail.com' })
          .expect(409)
          .expect({ message: 'Conflict', detail: 'username already in use.' });

        const usersAtEnd = await usersInDb();
        expect(usersAtEnd).to.have.length(usersAtStart.length + 1);
      });

      // Email in use.
      it('should not create a new user if email is already in use.', async () => {
        const newUser = getNewUser();

        // Increments users by one.
        await api.post('/api/users').send(newUser);

        await api
          .post('/api/users')
          .send({ ...newUser, username: 'Testaaja123' })
          .expect(409)
          .expect({ message: 'Conflict', detail: 'email already in use.' });

        const usersAtEnd = await usersInDb();
        expect(usersAtEnd).to.have.length(usersAtStart.length + 1);
      });

      // Invalid data format.
      it('should not work for missing data', async () => {
        // Increments users by one.
        const newUser = getNewUser();

        await api
          .post('/api/users')
          .send({ ...removeField(newUser) })
          .expect(400);

        const usersAtEnd = await usersInDb();
        expect(usersAtEnd).to.have.length(usersAtStart.length);
      });
    });
  });

  /************************************
   ** AUTHENTICATING AN EXISTING USER **
   ************************************/
  describe('[POST /api/login] Authenticating user', () => {
    let user = otherUsers[0];
    let validCredentials = login();
    let userCredentials = { username: user.username, password: user.password };

    const loginReq = (body, { code }) => {
      const req = api.post('/api/login').send(body).expect(code);
      return req;
    };

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
      expect(body.token).to.be.a('string');
      expect(body).to.have.property('user');

      const user = await User.findById(body.user.id);
      expect(body.user).to.eql(user.toJSON());
    });
  });
});

after('Close DB connection.', () => {
  mongoose.connection.close();
});
