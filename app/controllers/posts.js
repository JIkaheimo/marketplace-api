//@ts-check

/**
 * Routing/Controller module for hanling post
 * related requests.
 * @module controllers/posts
 */

// Third party modules.
import { Router } from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';

// In-house modules.
import { Post, User } from '../models/index.js';
import { auth } from '../utils/index.js';
import {
  badRequestError,
  forbiddenError,
  notFoundError,
} from '../utils/errors.js';
import { IMAGES_PATH } from '../utils/config.js';
import { validatePost } from '../utils/middleware.js';
import { createPost, searchPosts } from '../queries/index.js';

// Configure multer to.
const multerUpload = multer({
  // Path to store the images.
  dest: `${IMAGES_PATH}`,
  // Makes sure every file is image.
  fileFilter: (req, { mimetype }, cb) => {
    // Set flag if there is a file that is no image.
    if (!mimetype.startsWith('image')) req['invalidUpload'] = true;

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

/***********************************
 ** [GET] FETCH/DISPLAY ALL POSTS **
 ***********************************/
postsRouter.get(
  '/',
  async ({ query: { limit = 20, offset = 0 } }, res, next) => {
    // Throw an error if limit or offset is invalid.
    if (Number.isNaN(+limit) || Number.isNaN(+offset)) next(badRequestError());
    if (offset < 0 || limit < 0 || limit > 100) next(badRequestError());
    // Fetch all the posts.
    const posts = await Post.find()
      .limit(+limit)
      .skip(+offset)
      .exec();
    // Return the posts.
    res.json(posts);
  }
);

/******************************
 ** [POST] CREATE A NEW POST **
 ******************************/
postsRouter.post(
  '/',
  [auth.authenticate, validatePost], // Make sure the user is authenticated.
  async ({ userId, parsed: postInfo }, res) => {
    // Find the user creating a new post.
    const user = await User.findById(userId);
    // Create a new post.
    const createdPost = await createPost(user, postInfo);
    // Return th created post.
    res.json(createdPost);
  }
);

/*************************
 ** [POST] SEARCH POSTS **
 *************************/
postsRouter.post('/search', async ({ body }, res) => {
  // Return empty array for empty body.
  if (Object.values(body).length === 0) return res.json([]);
  // Search posts based on the filters passed in body.
  const posts = await searchPosts(body);
  // Return the filtered posts.
  res.json(posts);
});

/*****************************************************
 ** [GET] FETCHES/DISPLAYS A POST WITH THE GIVEN ID **
 *****************************************************/
postsRouter.get('/:id', [findPost], async ({ post }, res) => {
  // Just return the post parsed by middleware.
  res.json(post);
});

/***************************************************
 ** [POST] UPLOAD AND ASSOCIATE IMAGE WITH A POST **
 ***************************************************/
postsRouter.post(
  '/:id/upload',
  [
    findPost, // Make sure the post exists.
    auth.authenticate, // Make sure the user is authenticated
    authorize, // Make sure the is authorized to upload post images.
    multerUpload.array('fileName', 4),
  ],
  async ({ invalidUpload, files = [], post, hostPath }, res, next) => {
    // Remove all files and throw error if unsupported files were provided.
    if (invalidUpload) {
      await Promise.all(files.map(file => fs.rm(file.path)));
      next(badRequestError());
    }
    // Remove old images.
    const removePromises = post.imageUrls.map(imageUrl => {
      console.log(imageUrl);
      const imagePathParts = imageUrl.split('/');
      const imagePath = imagePathParts[imagePathParts.length - 1];
      const imageFile = path.join(IMAGES_PATH, imagePath);
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
    await Post.findByIdAndUpdate(post.id, { imageUrls }, { new: true });

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
    findPost, // Make sure the post exists.
    auth.authenticate, // Make sure the user is logged in.
    authorize, // Make sure the user is authorized to modify the post.
    validatePost, // Make sure post is in valid format.
  ],
  async ({ post, parsed }, res) => {
    // Update the post with the provided data.
    const updatedPost = await Post.findByIdAndUpdate(post.id, parsed, {
      new: true,
    });
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
    findPost, // Make sure the post exists.
    auth.authenticate, // Make sure the user is logged in.
    authorize, // Make sure the is authorized to delete the post.
  ],
  async ({ post }, res) => {
    // Delete the post.
    await Post.findByIdAndRemove(post.id);
    // Return the 204 (No Content)
    res.status(204).end();
  }
);

export default postsRouter;
