const { Post, User } = require("../app/models");

const initialPosts = [
  {
    id: "60114fded0f11b3114ae61a5",
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
    id: "60114fded0f11b3be4a331a5",
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

const fakeId = async () => {
  const tempPost = new Post({ ...initialPosts[0], title: "Temporary post" });
  await tempPost.save();
  await tempPost.remove();
  return tempPost._id.toString();
};

const postsInDb = async () => {
  const posts = await Post.find({});
  return posts.map(p => p.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map(u => u.toJSON());
};

module.exports = {
  initialPosts,
  fakeId,
  postsInDb,
  usersInDb,
};
