const postsRouter = require("express").Router();
const { Post, User } = require("../models");
const { checkToken } = require("../utils/auth");
const moment = require("moment");

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
postsRouter.post("/", [checkToken], async (req, res) => {
  const user = await User.findById(req.userId);

  const post = new Post({
    ...getRequiredFields(req.body),
    posted: new Date(),
    location: user.address,
    seller: user,
    imageUrls: [],
  });

  const savedPost = await post.save();
  res.json(savedPost);
});

// [POST] Search posts.
postsRouter.post("/search", async (req, res) => {
  const { country, city, posted, category } = req.body;
  const query = {};
  if (country) query["location.country"] = country;
  if (city) query["location.city"] = city;
  if (posted) {
    const today = moment().startOf("day");
    query.posted = {
      $gte: today.toDate(),
      $lte: moment(today).endOf("day").toDate(),
    };
  }
  if (category) query.category = category;

  const posts = await Post.find(query);
  res.json(posts);
});

// [GET] Display a post with the id.
postsRouter.get("/:id", async ({ params: { id } }, res) => {
  const post = await Post.findById(id);
  post ? res.json(post) : res.status(404).end();
});

// [PUT] Modify a post with the id.
postsRouter.put("/:id", [checkToken], async ({ params: { id }, body }, res) => {
  const post = await Post.findById(id);

  const updatedPost = await Post.findByIdAndUpdate(
    id,
    ...getRequiredFields(body),
    { new: true }
  );
  res.json(updatedPost);
});

// [DELETE] Delete a post the id.
postsRouter.delete("/:id", [checkToken], async ({ params: { id } }, res) => {
  await Post.findByIdAndRemove(id);
  res.status(204).end();
});

module.exports = postsRouter;
