const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app/app");
const { expect } = require("chai");
const { Post } = require("../app/models");
const { initialPosts, postsInDb, nonexistingId } = require("./helpers");

const api = supertest(app);

beforeEach("Create test posts.", async () => {
  await Post.deleteMany({});
  await new Post(initialPosts[0]).save();
  await new Post(initialPosts[0]).save();
});

/************************
 ** FETCHING ALL POSTS **
 ************************/
describe("GET /api/posts", () => {
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
});

/*************************
 ** CREATING A NEW POST **
 *************************/
describe("POST /api/posts", () => {
  describe("with invalid data", () => {
    const testInvalidPost = async body => {
      await api
        .post("/api/posts")
        .send(body)
        .expect(400)
        .expect("Content-Type", /application\/json/);
      const postsAtEnd = await postsInDb();
      expect(postsAtEnd).to.have.length(initialPosts.length);
    };

    it("should not create a post for empty body", async () => {
      await testInvalidPost({});
    });

    it("should not create a post with invalid title", async () => {
      await testInvalidPost({ ...initialPosts[0], title: "" });
      await testInvalidPost({ ...initialPosts[0], title: 1231203910231 });
      await testInvalidPost({ ...initialPosts[0], title: "asd" });
      await testInvalidPost({
        ...initialPosts[0],
        title: "asdasdaksljfjlasfljajsflkasjlflkasf",
      });
    });

    it("should not create a post with invalid description", async () => {
      await testInvalidPost({ ...initialPosts[0], description: "" });
      await testInvalidPost({ ...initialPosts[0], description: 1232912031213 });
    });

    it("should not create a post with invalid description", async () => {
      await testInvalidPost({ ...initialPosts[0], category: "" });
      await testInvalidPost({ ...initialPosts[0], category: 1232912031213 });
      await testInvalidPost({
        ...initialPosts[0],
        category: "I am not a category",
      });
    });
  });

  describe("with valid data", () => {
    const newPost = {
      title: "Polar bear toy",
      category: "cars",
      description: "Unused polar bear toy in a very good condition",
      askingPrice: 9.99,
      deliveryType: {
        pickup: true,
        shipping: true,
      },
    };

    it("should create a new post", async () => {
      let res = await api
        .post("/api/posts")
        .send(newPost)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(res.body).to.have.property("id");

      const postsAtEnd = await postsInDb();
      expect(postsAtEnd).to.have.length(initialPosts.length + 1);

      const titles = postsAtEnd.map(r => r.title);
      expect(titles).to.contain(newPost.title);
    });
  });
});

after("Close DB connection.", () => {
  mongoose.connection.close();
});
