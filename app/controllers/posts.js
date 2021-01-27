const postsRouter = require("express").Router();
const Post = require("../models/post");

// [GET] Display all posts.
postsRouter.get("/", async (req, res) => {
  const posts = await Post.find({});
  res.json(posts);
});

// [POST] Create a new post.
postsRouter.post("/", async ({ body }, res, next) => {
  // Create new post.
  const post = new Post({
    ...body,
    posted: new Date(),
    imageUrls: [],
  });

  console.log(new Date().to);

  // Save post and return it.
  try {
    const savedPost = await post.save();
    res.json(savedPost);
  } catch (error) {
    next(error);
  }
});

// [GET] Display a post with the id.
postsRouter.get("/:id", async ({ params }, res, next) => {
  const { id } = params;
  try {
    const post = await Post.findById(id);
    if (post) res.json(post);
    else res.status(404).end();
  } catch (error) {
    next(error);
  }
});

// [PUT] Modify a post with the id.
postsRouter.put("/:id", async ({ params, body }, res, next) => {
  const { id } = params;

  const post = { ...body };

  try {
    const updatedPost = await Post.findByIdAndUpdate(id, post, { new: true });
    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
});

// [DELETE] Delete a post the id.
postsRouter.delete("/:id", async ({ params }, res) => {
  const { id } = params;

  try {
    await Post.findByIdAndRemove(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = postsRouter;
