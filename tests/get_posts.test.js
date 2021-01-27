const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app/app");

const api = supertest(app);

describe("asd", () => {
  it("notes are returned as json", async () => {
    await api
      .get("/api/posts")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  after(() => {
    mongoose.connection.close();
  });
});
