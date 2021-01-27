const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app/app");
const { expect } = require("chai");
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
  },
];

const api = supertest(app);

describe("GET /api/posts", () => {
  beforeEach("Create test posts.", async () => {
    await Post.deleteMany({});
    await new Post(initialPosts[0]).save();
    await new Post(initialPosts[0]).save();
  });

  it("should return posts as JSON", async () => {
    await api
      .get("/api/posts")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should return all posts", async () => {
    const res = await api.get("/api/posts");
    expect(res.body).to.have.length(initialPosts.length);
  });

  it("should contain specific post", async () => {
    const res = await api.get("/api/posts");
    const titles = res.body.map(r => r.title);
    expect(titles).to.contain("Factory New Karambit");
  });

  after("Close DB connection.", () => {
    mongoose.connection.close();
  });
});
