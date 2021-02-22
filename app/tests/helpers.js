//@ts-check

/**
 * This file contains some useful helper methods
 * used for testing.
 */

import mongoose from 'mongoose';
import faker from 'faker';

import { Post, User } from '../models/index.js';
import { post, user, newPost, newUser } from './data.js';

export const initialUser = user('testaaja123');
export const initialPosts = Array(10)
  .fill()
  .map(_ => post(initialUser));

export const initialPasswords = Array(10)
  .fill()
  .map(() => faker.internet.password());
export const initialUsers = initialPasswords.map(pw => user(pw));

export const createUsers = async usersToCreate => {
  const usersWithoutPassword = usersToCreate.map(user => {
    const { password, ...others } = user;
    return others;
  });
  await User.deleteMany();
  await User.insertMany(usersWithoutPassword);
};

export const getNewPost = newPost;
export const getNewUser = newUser;

/**
 * Returns a bearer token based on the given username.
 * @param {string} username
 * @returns {Promise<string>} Bearer token of the user.
 */
export const getToken = async username => {
  const user = await User.findOne({ username });
  return user.token;
};

/**
 *
 * @param {import('supertest').Test} req
 * @param {string} token
 */
export const withToken = (req, token) =>
  req.set('Authorization', `bearer ${token}`);

export const fakeId = () => mongoose.Types.ObjectId();

export const postsInDb = async () => {
  const posts = await Post.find({});
  return posts.map(p => p.toJSON());
};

export const usersInDb = async () => {
  const users = await User.find({});
  return users.map(u => u.toJSON());
};

export default {
  getToken,
  withToken,
  initialUser,
  initialUsers,
  initialPasswords,
  initialPosts,
  fakeId,
  postsInDb,
  usersInDb,
  getNewPost,
  getNewUser,
};
