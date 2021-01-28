const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app/app");
const { expect } = require("chai");
const { User } = require("../app/models");
const bcrypt = require("bcrypt");
const { usersInDb, fakeId } = require("./helpers");

const api = supertest(app);

describe("when there is one user in the database", () => {
  //
  beforeEach(async () => {
    await User.deleteMany({});
    const passwordHash = await bcrypt.hash("password", 10);
    const user = new User({
      email: "testaaja123@test.com",
      username: "Testaaja123",
      address: {
        city: "Oulu",
        country: "Finland",
        postalCode: 90550,
        street: "Testaajantie 123",
      },
      phoneNumber: "+358401231231",
      birthDate: "1994-08-05",
      passwordHash,
      creationDate: new Date().toISOString().split("T")[0],
    });
    await user.save();
  });

  describe("POST /api/users", () => {
    //
    describe("with valid data", () => {
      it("should create a new user with", async () => {
        const usersAtStart = await usersInDb();
        const newUser = {
          email: "testaaja345@test.com",
          username: "Testaaja345",
          address: {
            city: "Oulu",
            country: "Finland",
            postalCode: 90550,
            street: "Testaajantie 123",
          },
          phoneNumber: "+358401231231",
          birthDate: "1994-08-05",
          password: "testaaja",
        };

        await api
          .post("/api/users")
          .send(newUser)
          .expect(200)
          .expect("Content-Type", /application\/json/);

        const usersAtEnd = await usersInDb();
        expect(usersAtEnd).to.have.length(usersAtStart.length + 1);

        const usernames = usersAtEnd.map(u => u.username);
        expect(usernames).to.contain(newUser.username);
      });
    });

    describe("with invalid data", () => {
      //
      it("should not create a new user if username is already in use.", async () => {
        const usersAtStart = await usersInDb();

        const newUser = {
          ...usersAtStart[0],
          email: "asdasdasd@test.com",
          password: "asdasd",
        };

        await api
          .post("/api/users")
          .send(newUser)
          .expect(409)
          .expect("Content-Type", /application\/json/)
          .expect({ message: "username already in use" });

        const usersAtEnd = await usersInDb();
        expect(usersAtEnd).to.have.length(usersAtStart.length);
      });

      it("should not create a new user if email is already in use.", async () => {
        const usersAtStart = await usersInDb();

        const newUser = {
          ...usersAtStart[0],
          username: "asdasdaasd",
          password: "asdasd",
        };

        await api
          .post("/api/users")
          .send(newUser)
          .expect(409)
          .expect("Content-Type", /application\/json/)
          .expect({ message: "email already in use" });

        const usersAtEnd = await usersInDb();
        expect(usersAtEnd).to.have.length(usersAtStart.length);
      });
    });
  });
});

after("Close DB connection.", () => {
  mongoose.connection.close();
});
