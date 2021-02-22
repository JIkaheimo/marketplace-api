//@ts-check

// Third-party modules.
import mongoose from 'mongoose';
import faker from 'faker';
import path from 'path';
import supertest from 'supertest';
import { default as chai } from 'chai';
const { expect } = chai;
import fs from 'fs/promises';

// In-house modules.
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

const { unauthorized, notFound, badRequest } = ERRORS;

/**
 * Simple higher-order function to allow easier
 * comparison of posts in the beginning and the end.
 */
const comparePosts = (postsAtStart, callback) => {
  return async () => {
    const postsAtEnd = await postsInDb();
    callback(postsAtStart, postsAtEnd);
  };
};

const api = supertest(app);

describe('when there are some posts in the database', () => {
  let token = null;
  let seller = null;
  let location = null;

  // Fill database with user.
  beforeEach('Create test user.', async () => {
    await createUsers([initialUser]);
  });

  // Fill test database with some posts.
  beforeEach('Create test posts.', async () => {
    await Post.deleteMany({});
    await Post.insertMany(initialPosts);
  });

  // Get valid breare token.
  beforeEach('Get valid bearer token.', async () => {
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
  describe('[GET /api/posts] fetching all posts', () => {
    // Helper functions.
    const getPosts = () => api.get('/api/posts');
    //
    it('should return posts as JSON', async () => {
      await getPosts()
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it('should return all posts', async () => {
      const res = await getPosts();
      expect(res.body).to.have.length(initialPosts.length);
    });

    it('should contain specific post', async () => {
      const res = await getPosts();
      const titles = res.body.map(r => r.title);
      expect(titles).to.contain(initialPosts[0].title);
    });

    it('should work for authenticated user', async () => {
      await withToken(getPosts(), token).expect(200);
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
      it('should require authentication', async () => {
        await api
          .post('/api/posts')
          .send({ ...getNewPost() })
          .expect(unauthorized.code)
          .expect({ message: unauthorized.message });
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
    const getPost = id => api.get(`/api/posts/${id}`);

    describe('with valid id', () => {
      // Post with valid id.
      it('should return a post with the id', async () => {
        const postsAtStart = await postsInDb();
        const postToView = faker.random.arrayElement(postsAtStart);

        const resultPost = await getPost(postToView.id)
          .expect(200)
          .expect('Content-Type', /application\/json/);

        const prPostToView = JSON.parse(JSON.stringify(postToView));
        expect(resultPost.body).to.eql(prPostToView);
      });
    });

    describe('with non-existing id', () => {
      it('should return status code 404 (Not Found)', async () => {
        await getPost(fakeId())
          .expect(notFound.code)
          .expect({ message: notFound.message });
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
   ** MDIFYING A POST **
   *********************/
  describe('[PUT /api/posts/:id] Modifying a post', () => {
    let postsAtStart = null;
    const modifyPost = postId => api.put(`/api/posts/${postId}`);
    const modifyPostAuth = postId => withToken(modifyPost(postId), token);

    beforeEach('fetch initial posts', async () => {
      postsAtStart = await postsInDb();
    });

    // Invalid indentifier.
    describe('with invalid identifier', () => {
      // Without authentication.
      describe('without authentication', () => {
        // Non-existing id.
        it('should return not found for non-existing id', async () => {
          await modifyPostAuth(fakeId())
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });

        // Invalid id.
        it('should return not found for invalid id', async () => {
          await modifyPost('invalid-id')
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });
      });

      // With authentication.
      describe('with authentication', () => {
        // Non-existing id.
        it('should return not found for non-existing id', async () => {
          await modifyPost(fakeId())
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });
        // Invalid id.
        it('should return not found for invalid id', async () => {
          await modifyPost('invalid-id')
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });
      });
    });

    // Valid identifier.
    describe('with valid identifier', () => {
      let postToDelete = null;

      // Get a valid post id.
      beforeEach('randomize post to delete', async () => {
        const posts = await postsInDb();
        postToDelete = faker.random.arrayElement(posts);
      });

      // Without authentication.
      describe('without authentication', () => {
        // Valid body.
        it('should return unauthorized for valid body', async () => {
          await modifyPost(postToDelete.id)
            .expect(unauthorized.code)
            .expect({ message: unauthorized.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });

        // Invalid body.
        it('should return unauthorized for invalid body', async () => {
          await modifyPost(postToDelete.id)
            .send({ invalid: 'invalid' })
            .expect(unauthorized.code)
            .expect({ message: unauthorized.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });
      });

      // With authentication.
      describe('with authentication', () => {
        // Valid body.
        it('should return no content and delete a post for valid body', async () => {
          await modifyPostAuth(postToDelete.id).expect(204);
          // Make sure post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd).to.have.length(postsAtStart.length - 1);
          expect(postsAtEnd.map(p => p.id)).to.not.contain(postToDelete.id);
        });

        // Invalid body.
        it('should return bad request for invalid body.', async () => {
          await modifyPostAuth(postToDelete.id)
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });
          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd).to.have.length(postsAtStart.length);
        });
      });
    });
  });

  /*********************
   ** DELETING A POST **
   *********************/
  describe.skip('[DELETE /api/posts/:id] Deleting a post', () => {
    let postsAtStart = null;
    const deletePost = postId => api.delete(`/api/posts/${postId}`);
    const deletePostAuth = postId => withToken(deletePost(postId), token);

    beforeEach('fetch initial posts', async () => {
      postsAtStart = await postsInDb();
    });

    // Invalid indentifier.
    describe('with invalid identifier', () => {
      // Without authentication.
      describe('without authentication', () => {
        // Non-existing id.
        it('should return not found for non-existing id', async () => {
          await deletePostAuth(fakeId())
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });

        // Invalid id.
        it('should return not found for invalid id', async () => {
          await deletePost('invalid-id')
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });
      });

      // With authentication.
      describe('with authentication', () => {
        // Non-existing id.
        it('should return not found for non-existing id', async () => {
          await deletePost(fakeId())
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });
        // Invalid id.
        it('should return not found for invalid id', async () => {
          await deletePost('invalid-id')
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });
      });
    });

    // Valid identifier.
    describe('with valid identifier', () => {
      let postToDelete = null;

      // Get a valid post id.
      beforeEach('randomize post to delete', async () => {
        const posts = await postsInDb();
        postToDelete = faker.random.arrayElement(posts);
      });

      // Without authentication.
      describe('without authentication', () => {
        // Valid body.
        it('should return unauthorized for valid body', async () => {
          await deletePost(postToDelete.id)
            .expect(unauthorized.code)
            .expect({ message: unauthorized.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });

        // Invalid body.
        it('should return unauthorized for invalid body', async () => {
          await deletePost(postToDelete.id)
            .send({ invalid: 'invalid' })
            .expect(unauthorized.code)
            .expect({ message: unauthorized.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.have.length(postsAtEnd.length);
        });
      });

      // With authentication.
      describe('with authentication', () => {
        // Valid body.
        it('should return no content and delete a post for valid body', async () => {
          await deletePostAuth(postToDelete.id).expect(204);
          // Make sure post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd).to.have.length(postsAtStart.length - 1);
          expect(postsAtEnd.map(p => p.id)).to.not.contain(postToDelete.id);
        });

        // Invalid body.
        it('should return bad request for invalid body.', async () => {
          await deletePostAuth(postToDelete.id)
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });
          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd).to.have.length(postsAtStart.length);
        });
      });
    });
  });

  /*****************************
   ** UPLOADING POST IMAGE(S) **
   *****************************/
  describe('POST /api/posts/:id/upload', () => {
    let post = null;
    let upload = null;
    let uploadWithToken = null;
    //
    beforeEach('Randomize post', async () => {
      const posts = await postsInDb();
      post = faker.random.arrayElement(posts);
      upload = (id = post.id) => api.post(`/api/posts/${id}/upload`);
      uploadWithToken = (id = post.id) => withToken(upload(id), token);
    });
    //
    afterEach('Remove image folder', async () => {
      //await fs.rm(IMAGES_PATH, { recursive: true, force: true });
    });

    // Nonexisting post.
    it('should not upload for post with invalid id', async () => {
      await uploadWithToken(fakeId())
        .send()
        .expect(notFound.code)
        .expect({ message: notFound.message });
    });

    // Removing images.
    it('should remove the images when none is provided', async () => {
      await uploadWithToken().send().expect(200).expect([]);
    });

    // Uploading one image.
    it('should upload attached image', async () => {
      await uploadWithToken()
        .attach('fileName', './app/tests/1.png')
        .expect(200);
    });

    // Uploading multiple images.
    it('should upload attached images', async () => {
      const res = await uploadWithToken()
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/index.jpg')
        .attach('fileName', './app/tests/1.png')
        .expect(200);
      expect(res.body).to.have.lengthOf(4);
      expect(res.body[0]).to.be.a('string');
    });

    // Uploading more than max num of images.
    it('should return a correct response type for invalid amount of images', async () => {
      await uploadWithToken()
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .expect(badRequest.code)
        .expect({ message: badRequest.message });
    });

    // Uploading files of
    it('should return a correct response type for invalid file type', async () => {
      await uploadWithToken()
        .attach('fileName', './app/tests/empty.txt')
        .expect(badRequest.code)
        .expect({ message: badRequest.message });
    });

    /*
    // Unauthenticated user.
    it('should require authentication', async () => {
      await api
        .post(`/api/posts/${post.id}/upload`)
        .attach('fileName', './app/tests/1.png')
        .expect(unauthorized.code)
        .expect({ message: unauthorized.message });
    });
    */
  });
});

after('Close DB connection.', () => {
  mongoose.connection.close();
});
