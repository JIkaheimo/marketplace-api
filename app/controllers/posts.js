const postsRouter = require("express").Router();
const Post = require("../models/post");

const getRequiredFields = ({
  title,
  description,
  category,
  askingPrice,
  deliveryType,
}) => ({ title, description, category, askingPrice, deliveryType });

// [GET] Display all posts.
postsRouter.get("/", async (req, res) => {
  const posts = await Post.find({});
  res.json(posts);
});

// [POST] Create a new post.
postsRouter.post("/", async ({ body }, res, next) => {
  const post = new Post({
    ...getRequiredFields(body),
    posted: new Date(),
    imageUrls: [],
  });

  const savedPost = await post.save();
  res.json(savedPost);
});

// [GET] Display a post with the id.
postsRouter.get("/:id", async ({ params: { id } }, res, next) => {
  const post = await Post.findById(id);
  post ? res.json(post) : res.status(404).end();
});

// [PUT] Modify a post with the id.
postsRouter.put("/:id", async ({ params: { id }, body }, res, next) => {
  const updatedPost = await Post.findByIdAndUpdate(
    id,
    ...getRequiredFields(body),
    { new: true }
  );
  res.json(updatedPost);
});

// [DELETE] Delete a post the id.
postsRouter.delete("/:id", async ({ params: { id } }, res) => {
  await Post.findByIdAndRemove(id);
  res.status(204).end();
});

module.exports = postsRouter;
