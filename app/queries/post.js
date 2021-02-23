//@ts-check

/**
 * This module contains some queries
 * to access and modigy posts in MongoDB.
 */

// Third-party modules.
import { default as moment } from 'moment';
import { default as mongoose } from 'mongoose';

// In-house modules
import { getLocation, getSeller, Post } from '../models/index.js';
import { badRequestError } from '../utils/errors.js';

/**
 * Adds a new post to the database.
 * @param {import('../types.js').User} user
 * @param {import('../types.js').Post} postInfo
 * @return {Promise<mongoose.Document<import('../types.js').Post>>}
 */
export const createPost = async (user, postInfo) => {
  // Create a new post.
  const post = new Post({
    ...postInfo,
    posted: new Date(), // Generate timestamp.
    location: getLocation(user), // Get location from the user.
    seller: getSeller(user), // Get seller info from the user.
    imageUrls: [], // Initialize empty image array.
  });
  // Save the newly created post and return it.
  return await post.save();
};

/**
 * Applies country filter to the given query object.
 */
const withCountry = (query, country) => ({
  ...query,
  'location.country': country,
});

/**
 * Applies city filter to the given query object.
 */
const withCity = (query, city) => ({
  ...query,
  'location.city': city,
});

/**
 * Applies posted date filter to the given query object.
 */
const withPosted = (query, date) => {
  const datePosted = moment(date, 'YYYY-MM-DD');
  // Make sure date was in valid forma.
  if (!datePosted.isValid()) throw badRequestError();
  return {
    ...query,
    posted: {
      $gte: datePosted.startOf('day').toDate(),
      $lt: datePosted.endOf('day').toDate(),
    },
  };
};

/**
 * Searches posts in database by applying the given filters.
 * @param {*} filters
 * @returns {Promise<mongoose.Document<import('../types.js').Post>[]>}
 */
export const searchPosts = async ({ country, city, category, posted }) => {
  let query = {};
  // Apply filters.
  if (country) query = withCountry(query, country);
  if (city) query = withCity(query, city);
  if (posted) query = withPosted(query, posted);
  if (category) query.category = category;
  // Find the posts with the given filters.
  return await Post.find(query);
};
