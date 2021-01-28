const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app/app");
const { expect } = require("chai");
const { Post } = require("../app/models");
const { initialPosts, postsInDb, fakeId } = require("./helpers");

const api = supertest(app);

describe("when there are some posts in the database", () => {
  //
  beforeEach("Create test posts.", async () => {
    await Post.deleteMany({});
    await Post.insertMany(initialPosts);
  });

  /************************
   ** FETCHING ALL POSTS **
   ************************/
  describe("GET /api/posts", () => {
    //
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
    //
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
        await testInvalidPost({
          ...initialPosts[0],
          description: 1232912031213,
        });
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
      //
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

  /******************************
   ** FETCHING A SPECIFIC POST **
   ******************************/
  describe("GET /api/posts/:id", () => {
    //
    describe("with valid id", () => {
      it("should return a post with the id", async () => {
        const postsAtStart = await postsInDb();
        const postToView = postsAtStart[0];

        const resultPost = await api
          .get(`/api/posts/${postToView.id}`)
          .expect(200)
          .expect("Content-Type", /application\/json/);

        const prPostToView = JSON.parse(JSON.stringify(postToView));
        expect(resultPost.body).to.eql(prPostToView);
      });
    });

    describe("with non-existing id", () => {
      it("should return status code 404 (Not Found)", async () => {
        const fakedId = await fakeId();
        await api.get(`/api/posts/${fakedId}`).expect(404);
      });
    });

    describe("with invalid id", () => {
      it("should return status code 404 (Bad Request)", async () => {
        await api.get("/api/posts/5a3d5da59070081a82a3445").expect(400);
      });
    });
  });

  /*********************
   ** DELETING A POST **
   *********************/
  describe("DELETE /api/posts/:id", () => {
    //
    it("should not delete a nonexisting post and return status code 204 (Created)", async () => {
      await api.delete(`/api/posts/60114fded0f11b3be4ae6123`).expect(204);
      const postsAtEnd = await postsInDb();
      expect(postsAtEnd).to.have.length(initialPosts.length);
    });

    it("should delete a post with the id aand return status code 204 (Created)", async () => {
      const postsAtStart = await postsInDb();
      const postToDelete = postsAtStart[0];

      await api.delete(`/api/posts/${postToDelete.id}`).expect(204);

      const postsAtEnd = await postsInDb();

      expect(postsAtEnd).to.have.length(initialPosts.length - 1);

      const titles = postsAtEnd.map(post => post.title);
      expect(titles).not.to.contain(postToDelete.title);
    });
  });
});

after("Close DB connection.", () => {
  mongoose.connection.close();
});
