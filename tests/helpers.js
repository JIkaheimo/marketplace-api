const { Post } = require("../app/models");

const initialPosts = [
  {
    title: "Factory New Karambit",
    category: "cars",
    description: "CS GO karambit now in real life!",
    askingPrice: 129.99,
    deliveryType: {
      pickup: true,
      shipping: true,
    },
    posted: new Date(),
  },
  {
    title: "Well-worn Audi A4",
    category: "cars",
    description: "Audi A4 model XXXX with 50k kilometers driven.",
    askingPrice: 12999.99,
    deliveryType: {
      pickup: true,
      shipping: false,
    },
    posted: new Date(),
  },
];

const nonexistingId = async () => {
  const tempPost = new Post({ ...initialPosts[0], title: "Temporary post" });
  await tempPost.save();
  await tempPost.remove();
  return tempPost._id.toString();
};

const postsInDb = async () => {
  const posts = await Post.find({});
  return posts;
};

module.exports = {
  initialPosts,
  nonexistingId,
  postsInDb,
};
