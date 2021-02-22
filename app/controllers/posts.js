//@ts-check

/**
 * Routing/Controller module for hanling post
 * related requests.
 * @module controllers/posts
 */

// Third party modules.
import { Router } from 'express';
import fs from 'fs/promises';
import moment from 'moment';
import multer from 'multer';
import path from 'path';

// In-house modules.
import { getSeller, getLocation, Post, User } from '../models/index.js';
import { auth } from '../utils/index.js';
import {
  badRequestError,
  forbiddenError,
  notFoundError,
} from '../utils/errors.js';
import { IMAGES_PATH } from '../utils/config.js';
import { validatePost } from '../utils/middleware.js';

// Configure multer to.
const multerUpload = multer({
  dest: IMAGES_PATH,
  fileFilter: (req, file, cb) => {
    // Make sure file is an image...
    if (!file.mimetype.startsWith('image')) cb(badRequestError());
    // Accept the file.
    cb(null, true);
  },
});

/**
 * Posts router.
 */
export const postsRouter = Router();

/**
 * Simple middleware to check if the fetched
 * resource should be authorized to user by the user.
 *
 * @type {import('express').RequestHandler}
 */
const findPost = async (req, _, next) => {
  // Get the post with the passed id param.
  const post = await Post.findById(req.params.id);
  // Make sure post exists.
  if (!post) next(notFoundError());
  // Attach post to request.
  req['post'] = post;
  // Call next middleware.
  next();
};

/**
 * Simple middleware to check if the fetched
 * resource should be authorized to user by the user.
 */
const authorize = async ({ post, username }, _, next) => {
  // Make sure the user owns/manages the post.
  if (post.seller.username !== username) next(forbiddenError());
  // Call next middleware.
  next();
};

// Add middleware to find a post based on the
// id param.
postsRouter.use('/:id', findPost);

/***********************************
 ** [GET] FETCH/DISPLAY ALL POSTS **
 ***********************************/
postsRouter.get('/', async (_, res) => {
  // Fetch all the posts.
  const posts = await Post.find({});
  // Return the posts.
  res.json(posts);
});

/******************************
 ** [POST] CREATE A NEW POST **
 ******************************/
postsRouter.post(
  '/',
  [auth.authenticate, validatePost], // Make sure the user is authenticated.
  async ({ userId, parsed }, res) => {
    // Find the user creating a new post.
    const user = await User.findById(userId);
    // Create a new post.
    const post = new Post({
      ...parsed,
      posted: new Date(), // Generate timestamp.
      location: getLocation(user), // Get location from the user.
      seller: getSeller(user), // Get seller info from the user.
      imageUrls: [], // Initialize empty image array.
    });
    // Save the newly created post.
    const savedPost = await post.save();
    // Return th created post.
    res.json(savedPost);
  }
);

/*************************
 ** [POST] SEARCH POSTS **
 *************************/
postsRouter.post(
  '/search',
  async ({ body: { country, city, posted, category } }, res) => {
    const query = {};
    if (country) query['location.country'] = country;
    if (city) query['location.city'] = city;
    if (posted) {
      const today = moment().startOf('day');
      query.posted = {
        $gte: today.toDate(),
        $lte: moment(today).endOf('day').toDate(),
      };
    }
    if (category) query.category = category;
    // Execute the query.
    const posts = await Post.find(query);
    res.json(posts);
  }
);

/*****************************************************
 ** [GET] FETCHES/DISPLAYS A POST WITH THE GIVEN ID **
 *****************************************************/
postsRouter.get('/:id', async (req, res) => {
  // Just return the post parsed by middleware.
  res.json(req['post']);
});

/***************************************************
 ** [POST] UPLOAD AND ASSOCIATE IMAGE WITH A POST **
 ***************************************************/
postsRouter.post(
  '/:id/upload',
  [
    auth.authenticate, // Make sure the user is authenticated
    authorize, // Make sure the is authorized to upload post images.
    multerUpload.array('fileName', 4),
  ],
  async ({ files = [], post, hostPath }, res) => {
    // Remove old images.
    const removePromises = post.imageUrls.map(imageUrl => {
      const imageFile = path.join(IMAGES_PATH, imageUrl.split('/')[-1]);
      return fs.rm(imageFile);
    });
    await Promise.all(removePromises);
    // Add image extension to image names.
    const imageNames = files.map(
      file => `${file.path}.${file.mimetype.split('/')[1]}`
    );
    // Map image names to the corresponding paths.
    const imageUrls = imageNames.map(
      imageName => `${hostPath}/api/images/${imageName.split('\\')[1]}`
    );
    // Rename files.
    const renamePromises = files.map(file =>
      fs.rename(file.path, `${file.path}.${file.mimetype.split('/')[1]}`)
    );
    await Promise.all(renamePromises);
    // Update images.
    Post.findByIdAndUpdate(post.id, { imageUrls }, { new: true });
    // Return ok status.
    res.json(imageUrls);
  }
);

/*************************
 ** [PUT] MODIFY A POST **
 *************************/
postsRouter.put(
  '/:id', // Id of post to modify.
  [
    auth.authenticate, // Make sure the user is logged in.
    authorize, // Make sure the is authorized to modify the post.
    validatePost, // Make sure post is in valid format.
  ],
  async ({ params: { id }, parsed }, res) => {
    // Update the post with the provided data.
    const updatedPost = await Post.findByIdAndUpdate(id, parsed, { new: true });
    // Return the updated post.
    res.json(updatedPost);
  }
);

/****************************
 ** [DELETE] DELETE A POST **
 ****************************/
postsRouter.delete(
  '/:id', // Id of post to delete.
  [
    auth.authenticate, // Make sure the user is logged in.
    authorize, // Make sure the is authorized to delete the post.
  ],
  async ({ params: { id }, body }, res, next) => {
    // Make sure body is empty.
    if (Object.values(body).length > 0) return next(badRequestError());
    // Delete the post.
    await Post.findByIdAndRemove(id);
    // Return the 204 (No Content)
    res.status(204).end();
  }
);

export default postsRouter;
