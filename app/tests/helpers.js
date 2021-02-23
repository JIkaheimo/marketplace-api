//@ts-check

/**
 * This file contains some useful helper methods
 * used for testing.
 */

import mongoose from 'mongoose';
import faker from 'faker';

import { Post, User } from '../models/index.js';
import { post, user, newPost, newUser } from './data.js';

const NUM_OWN_POSTS = 10;
const NUM_OTHER_USERS = 4;
const NUM_OTHER_POSTS = 20;

/*********************************************
 ** OWNER - ACTS AS THE REQUEST MAKING USER **
 *********************************************/

/**
 * Password of the owner.
 * @type {string}
 */
export const ownerPassword = 'testaaja123';

/**
 * The post "owner" user for testing.
 * @type {import('../types.js').User}
 */
export const owner = user(ownerPassword);

/**
 * The "owner" posts for testing.
 * @type {import('../types.js').Post[]}
 */
export const ownerPosts = Array(NUM_OWN_POSTS)
  .fill()
  .map(_ => post(owner));

/*********************************
 ** OTHER USERS IN THE DATABASE **
 *********************************/

/**
 * Passwords of the other users.
 * @type {string[]}
 */
export const otherPasswords = Array(NUM_OTHER_USERS)
  .fill()
  .map(() => faker.internet.password());

/**
 * Other users in the database.
 * @type {import('../types.js').User[]}
 */
export const otherUsers = otherPasswords.map(pw => user(pw));

/**
 * Other user posts in the database.
 * @type {import('../types.js').Post[]}
 */
export const otherPosts = Array(NUM_OTHER_POSTS)
  .fill()
  .map(() => post(faker.random.arrayElement(otherUsers)));

export const getNewPost = newPost;
export const getNewUser = newUser;

/**
 * Initializes the database with the given users.
 * @param {import('../types.js').User[]} usersToCreate
 */
export const createUsers = async usersToCreate => {
  const usersWithoutPassword = usersToCreate.map(user => {
    const { password, ...others } = user;
    return others;
  });
  await User.deleteMany();
  await User.insertMany(usersWithoutPassword);
};

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
 * Returns all the posts in the database.
 */
export const postsInDb = async () => {
  const posts = await Post.find({});
  return posts.map(p => p.toJSON());
};

/**
 * Returns owner posts in the database.
 */
export const ownerPostsInDb = async () => {
  const ownerPosts = await Post.find({ 'seller.username': owner.username });
  return ownerPosts.map(p => p.toJSON());
};

/**
 * Returns other posts in the database.
 */
export const otherPostsInDb = async () => {
  const ownerPosts = await Post.find({
    'seller.username': { $ne: owner.username },
  });
  return ownerPosts.map(p => p.toJSON());
};

/**
 * Returns all the users in the database.
 */
export const usersInDb = async () => {
  const users = await User.find({});
  return users.map(u => u.toJSON());
};

/**
 * Adds the given oken to the supertest request.
 * @param {import('supertest').Test} req
 * @param {string} token
 */
export const withToken = (req, token) =>
  req.set('Authorization', `bearer ${token}`);

export const fakeId = () => mongoose.Types.ObjectId();

export default {
  getToken,
  withToken,
  owner,
  otherUsers,
  otherPasswords,
  ownerPosts,
  fakeId,
  postsInDb,
  usersInDb,
  getNewPost,
  getNewUser,
};
