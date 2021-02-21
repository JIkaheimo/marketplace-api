//@ts-check

/**
 * Routing/Controller module for hanling post
 * related requests.
 * @module controllers/posts
 */

import { Router } from 'express';
import fs from 'fs/promises';
import moment from 'moment';
import { Post, User } from '../models/index.js';
import { auth } from '../utils/index.js';

import multer from 'multer';
import { validatePost } from '../utils/middleware.js';
import { forbiddenError, notFoundError } from '../utils/errors.js';

const multerUpload = multer({ dest: 'images/' });

const postsRouter = Router();

const checkPost = async (req, res, next) => {
  // Get the post with the passed id param.
  const post = await Post.findById(req.params.id);
  // Make sure post exists.
  if (!post) next(notFoundError());
  // Attach post to request.
  req['post'] = post;
  // Call next middleware.
  next();
};

const authorize = async ({ post, username }, res, next) => {
  // Make sure the user owns/manages the post.
  if (post.seller.username !== username) next(forbiddenError());
  // Call next middleware.
  next();
};

postsRouter.use('/:id', checkPost);

// [GET] Display all posts.
postsRouter.get('/', async (req, res) => {
  const posts = await Post.find({});
  res.json(posts);
});

// [POST] Create a new post.
postsRouter.post(
  '/',
  [auth.authenticate, validatePost],
  async ({ userId, parsed }, res, next) => {
    // Find the user creating a new post.
    const user = await User.findById(userId);
    // Create a new post.
    const post = new Post({
      ...parsed,
      posted: new Date(),
      location: user.address,
      seller: user,
      imageUrls: [],
    });
    // Save the newly created post.
    const savedPost = await post.save();
    res.json(savedPost);
  }
);

// [POST] Search posts.
postsRouter.post('/search', async (req, res) => {
  const { country, city, posted, category } = req.body;
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

  const posts = await Post.find(query);
  res.json(posts);
});

// [GET] Display a post with the id.
postsRouter.get('/:id', async ({ params: { id } }, res) => {
  const post = await Post.findById(id);
  post ? res.json(post) : res.status(404).end();
});

// [POST] Add an image to post.
postsRouter.post(
  '/:id/images/upload',
  [auth.authenticate, authorize, multerUpload.array('fileName', 4)],
  async ({ files }, res) => {
    console.log(files);
    await Promise.all(
      files.map(file => fs.rename(file.path, `${file.path}.png`))
    );
    res.json({});
  }
);

// [PUT] Modify a post with the id.
postsRouter.put(
  '/:id', // post id
  [auth.authenticate, authorize, validatePost], // Make sure the user is logged in.
  async ({ params: { id }, body, username, parsed }, res, next) => {
    // Check if the post is owned by the user.
    const post = await Post.findById(id);
    if (post.seller.username !== username) return next(new Error('Forbidden'));
    // Update the post with the provided data.
    const updatedPost = await Post.findByIdAndUpdate(id, parsed, { new: true });
    // Return the updated post.
    res.json(updatedPost);
  }
);

// [DELETE] Delete a post the id.
postsRouter.delete(
  '/:id',
  [auth.authenticate, authorize],
  async ({ params: { id } }, res) => {
    await Post.findByIdAndRemove(id);
    res.status(204).end();
  }
);

export default postsRouter;
