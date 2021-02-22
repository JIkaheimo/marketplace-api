//@ts-check

import mongoose from 'mongoose';
import faker from 'faker';
import path from 'path';
import supertest from 'supertest';
import { default as chai } from 'chai';
const { expect } = chai;
import fs from 'fs/promises';

import app from '../server.js';
import { getLocation, getSeller, Post, User } from '../models/index.js';

import {
  withToken,
  initialUser,
  initialPosts,
  postsInDb,
  fakeId,
  getNewPost,
  getToken,
  createUsers,
} from './helpers.js';

import { ERRORS } from '../constants.js';
import { IMAGES_PATH } from '../utils/config.js';

const { unauthorized, notFound, badRequest } = ERRORS;

const api = supertest(app);

describe('when there are some posts in the database', () => {
  let token = null;
  let seller = null;
  let location = null;
  //
  beforeEach('Create test user.', async () => {
    // Add user to database.
    await createUsers([initialUser]);
  });
  //
  beforeEach('Create test posts.', async () => {
    // Add posts to database.
    await Post.deleteMany({});
    await Post.insertMany(initialPosts);
  });
  //
  beforeEach('Get valid bearer token.', async () => {
    // Get the token for initial user.
    token = await getToken(initialUser.username);
  });
  //
  beforeEach('Get post data from user.', () => {
    seller = getSeller(initialUser);
    location = getLocation(initialUser);
  });

  /************************
   ** FETCHING ALL POSTS **
   ************************/
  describe('GET /api/posts', () => {
    //
    it('should return posts as JSON', async () => {
      await api
        .get('/api/posts')
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it('should return all posts', async () => {
      const res = await api.get('/api/posts');
      expect(res.body).to.have.length(initialPosts.length);
    });

    it('should contain specific post', async () => {
      const res = await api.get('/api/posts');
      const titles = res.body.map(r => r.title);
      expect(titles).to.contain(initialPosts[0].title);
    });
  });

  /*************************
   ** CREATING A NEW POST **
   *************************/
  describe('POST /api/posts', () => {
    //
    describe('with invalid data', () => {
      const testInvalidPost = async body => {
        await withToken(api.post('/api/posts'), token)
          .send(body)
          .expect(400)
          .expect('Content-Type', /application\/json/);
        const postsAtEnd = await postsInDb();
        expect(postsAtEnd).to.have.length(initialPosts.length);
      };

      it('should not create a post for empty body', async () => {
        await testInvalidPost({});
      });

      it('should not create a post with invalid title', async () => {
        await testInvalidPost({ ...initialPosts[0], title: '' });
        await testInvalidPost({ ...initialPosts[0], title: 1231203910231 });
        await testInvalidPost({ ...initialPosts[0], title: 'asd' });
        await testInvalidPost({
          ...initialPosts[0],
          title: 'asdasdaksljfjlasfljajsflkasjlflkasf',
        });
      });

      it('should not create a post with invalid description', async () => {
        await testInvalidPost({ ...initialPosts[0], description: '' });
        await testInvalidPost({
          ...initialPosts[0],
          description: 1232912031213,
        });
      });

      it('should not create a post with invalid description', async () => {
        await testInvalidPost({ ...initialPosts[0], category: '' });
        await testInvalidPost({ ...initialPosts[0], category: 1232912031213 });
        await testInvalidPost({
          ...initialPosts[0],
          category: 'I am not a category',
        });
      });

      it('should not create a post with extranous fields', async () => {
        await withToken(api.post('/api/posts'), token)
          .send({ ...getNewPost(), extra: 'I am extra!' })
          .expect(badRequest.code)
          .expect('Content-Type', /application\/json/);
        const postsAtEnd = await postsInDb();
        expect(postsAtEnd).to.have.length(initialPosts.length);
      });
    });

    describe('with valid data', () => {
      it('should not create a new post without authentication', async () => {
        const newPost = getNewPost();
      });

      it('should create a new post', async () => {
        const newPost = getNewPost();
        const res = await withToken(api.post('/api/posts'), token)
          .send(newPost)
          .expect(200)
          .expect('Content-Type', /application\/json/);

        it('should include all the send information in response body', () => {
          expect(res.body).to.deep.include({ ...newPost, seller, location });
        });

        it('should increase the number of posts by one', async () => {
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd).to.have.length(initialPosts.length + 1);
        });
      });
    });
  });

  /******************************
   ** FETCHING A SPECIFIC POST **
   ******************************/
  describe('GET /api/posts/:id', () => {
    //
    describe('with valid id', () => {
      it('should return a post with the id', async () => {
        const postsAtStart = await postsInDb();
        const postToView = postsAtStart[0];

        const resultPost = await api
          .get(`/api/posts/${postToView.id}`)
          .expect(200)
          .expect('Content-Type', /application\/json/);

        const prPostToView = JSON.parse(JSON.stringify(postToView));
        expect(resultPost.body).to.eql(prPostToView);
      });
    });

    describe('with non-existing id', () => {
      it('should return status code 404 (Not Found)', async () => {
        const fakedId = await fakeId();
        await api.get(`/api/posts/${fakedId}`).expect(404);
      });
    });

    describe('with invalid id', () => {
      it('should return status code 404 (Bad Request)', async () => {
        await api
          .get('/api/posts/5a3d5da59070081a82a3445')
          .expect(notFound.code)
          .expect({ message: notFound.message });
      });
    });
  });

  /*********************
   ** DELETING A POST **
   *********************/
  describe('DELETE /api/posts/:id', () => {
    it('should not delete a nonexisting post', async () => {
      const postsInStart = await postsInDb();
      await api
        .delete('/api/posts/i-got-no-meaning')
        .send()
        .expect(notFound.code)
        .expect({ message: notFound.message });
      const postsInEnd = await postsInDb();
      expect(postsInStart).to.eql(postsInEnd);
    });

    //

    it('should delete a post with the id and return status code 204 (No Content)', async () => {
      // Get the posts in the beginning.
      const postsAtStart = await postsInDb();
      // Select random post to delete.
      const postToDelete = faker.random.arrayElement(postsAtStart);
      // Delete the post.
      await withToken(api.delete(`/api/posts/${postToDelete.id}`), token)
        .send()
        .expect(204);
      // Get the posts after deletion.
      const postsAtEnd = await postsInDb();
      // There should be 1 post less.
      expect(postsAtEnd).to.have.length(initialPosts.length - 1);
      // Check if the post has been deleted.
      const ids = postsAtEnd.map(post => post.id);
      expect(ids).not.to.contain(postToDelete.id);
    });
  });

  /*****************************
   ** UPLOADING POST IMAGE(S) **
   *****************************/
  describe('POST /api/posts/:id/upload', () => {
    let post = null;
    let upload = null;
    //
    beforeEach('Randomize post', async () => {
      const posts = await postsInDb();
      post = faker.random.arrayElement(posts);
      upload = () => withToken(api.post(`/api/posts/${post.id}/upload`), token);
    });
    //
    afterEach('Remove image folder', async () => {
      //await fs.rm(IMAGES_PATH, { recursive: true, force: true });
    });

    // Removing images.
    it('should remove the images when none is provided', async () => {
      await upload().send().expect(200).expect([]);
    });

    // Uploading one image.
    it('should upload attached image', async () => {
      await upload().attach('fileName', './app/tests/1.png').expect(200);
    });

    // Uploading multiple images.
    it('should upload attached images', async () => {
      const res = await upload()
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .expect(200);
      expect(res.body).to.have.lengthOf(4);
      expect(res.body[0]).to.be('string');
    });

    // Uploading more than max num of images.
    it('should return a correct response code for invalid amount of images', async () => {
      await upload()
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .expect(badRequest.code)
        .expect({ message: badRequest.message });
    });
    //
  });
});

after('Close DB connection.', () => {
  mongoose.connection.close();
});
