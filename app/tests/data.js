//@ts-check

/**
 * This file contains some helper functions
 * to generate some randomized data for testing.
 */

import faker from 'faker';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const SALT_ROUNDS = 10;

/**
 * Randomly generates a fake delivery type.
 * @returns {import('../types').DeliveryType} Randomly gnerated fake delivery type.
 */
export const delivery = () => ({
  shipping: faker.random.boolean(),
  pickup: faker.random.boolean(),
});

/**
 * Randomly generates a fake address.
 * @returns {import('../types').Address} Randomly generated fake address.
 */
export const address = () => ({
  city: faker.address.city(),
  country: faker.address.country(),
  postalCode: faker.address.zipCode(),
  street: faker.address.streetAddress(),
});

/**
 * Randomly generates a new fake user.
 * @param {string} [password=faker.internet.password()] User password.
 * @returns {import('../types').User} New user.
 */
export const newUser = (password = faker.internet.password()) => ({
  email: faker.internet.email(),
  username: faker.internet.userName(),
  address: address(),
  phoneNumber: faker.phone.phoneNumber(),
  birthDate: faker.date.past(),
  password,
});

/**
 * Randomly generates a fake user.
 * @param {string} password  User password.
 * @returns {import('../types').User} User.
 */
export const user = password => ({
  ...newUser(password),
  id: mongoose.Types.ObjectId(),
  passwordHash: bcrypt.hashSync(password, SALT_ROUNDS),
  creationDate: faker.date.recent(),
});

/**
 * Randomly generates a new fake post.
 * @returns {import('../types').Post} New post.
 */
export const newPost = () => ({
  description: faker.commerce.productDescription(),
  title: faker.commerce.productDescription().slice(0, 25),
  category: faker.random.arrayElement([
    'computers',
    'electronics',
    'cars',
    'pets',
    'food',
    'drinks',
  ]),
  askingPrice: faker.random.number(9999999),
  deliveryType: delivery(),
});

/**
 * Randomly generates a fake post.
 * @param {import('../types').User} user
 * @returns {import('../types').Post} Post.
 */
export const post = user => ({
  id: mongoose.Types.ObjectId(),
  ...newPost(),
  seller: getSeller(user),
  location: { ...user.address },
  imageUrls: [],
  posted: faker.date.past(),
});

/**
 * Randomly generates fake login credentials.
 */
export const login = () => ({
  password: faker.internet.password(),
  username: faker.internet.userName(),
});

/**
 * Returns seller info from the given user.
 * @param {import('../types').User} user
 * @returns {import('../types').Seller}
 */
export const getSeller = ({ email, phoneNumber, username }) => ({
  email,
  phoneNumber,
  username,
});

/**
 * Returns location info from the given user.
 * @param {import('../types').User} user
 * @returns {import('../types').Address}
 */
export const getLocation = ({ address }) => ({ ...address });

/**
 * Returns a new object with a random field removed.
 * @param {Object} obj Object to remove the field from.
 * @returns {Object} Object with a random field removed.
 */
export const removeField = obj => {
  const copiedObj = { ...obj };
  const fields = Object.keys(copiedObj);
  const randomField = faker.random.arrayElement(fields);
  delete copiedObj[randomField];
  return copiedObj;
};

export default {
  user,
  post,
  newPost,
  newUser,
  getSeller,
  removeField,
};
