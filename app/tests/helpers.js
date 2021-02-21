//@ts-check

/**
 * This file contains some useful helper methods
 * used for testing.
 */

import faker from 'faker';

import { Post, User } from '../models/index.js';
import {
  post,
  user,
  newPost,
  newUser,
  getLocation,
  getSeller,
} from './data.js';

export const initialUser = user('testaaja123');
export const initialPosts = Array(10)
  .fill()
  .map(_ => post(initialUser));

export const initialPasswords = Array(10)
  .fill()
  .map(() => faker.internet.password());
export const initialUsers = initialPasswords.map(pw => user(pw));

export const getNewPost = newPost;
export const getNewUser = newUser;
export { getLocation };
export { getSeller };

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

export const fakeId = async () => {
  const tempPost = new Post({ ...initialPosts[0], title: 'Temporary post' });
  await tempPost.save();
  await tempPost.remove();
  return tempPost._id.toString();
};

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
  getLocation,
  getSeller,
};
