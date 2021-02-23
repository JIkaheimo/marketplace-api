//@ts-check

// Third-party modules.
import mongoose from 'mongoose';
import faker from 'faker';
import supertest from 'supertest';
import { default as chai } from 'chai';
const { expect } = chai;
import fs from 'fs/promises';

// In-house modules.
import app from '../server.js';
import { getLocation, getSeller, Post } from '../models/index.js';

import {
  withToken,
  owner,
  ownerPosts,
  postsInDb,
  fakeId,
  getNewPost,
  getToken,
  createUsers,
  otherPosts,
  ownerPostsInDb,
  otherPostsInDb,
} from './helpers.js';

import { unauthorized, notFound, badRequest, forbidden } from '../constants.js';
import { removeField } from './data.js';
import { IMAGES_PATH } from '../utils/config.js';

const api = supertest(app);

describe('While handling post requests', () => {
  let token = null;
  let seller = null;
  let location = null;

  // Fill database with user.
  beforeEach('create the test user', async () => {
    await createUsers([owner]);
  });

  // Fill test database with some posts.
  beforeEach('create test posts.', async () => {
    await Post.insertMany([...ownerPosts, ...otherPosts]);
  });

  // Get valid breare token.
  beforeEach('get valid bearer token', async () => {
    token = await getToken(owner.username);
  });

  // Get seller post data.
  beforeEach('get post data from the user', () => {
    seller = getSeller(owner);
    location = getLocation(owner);
  });

  // Make sure to remove posts.
  afterEach('remove test posts', async () => {
    await Post.deleteMany({});
  });

  /************************
   ** FETCHING ALL POSTS **
   ************************/
  describe('[GET /api/posts] fetching all posts', () => {
    let postsAtStart = null;

    beforeEach('fetch initial posts', async () => {
      postsAtStart = await postsInDb();
    });

    // Helper functions.
    const getPosts = (params = '') => api.get(`/api/posts${params}`);
    const getPostsAuth = params => withToken(getPosts(params), token);
    const getLength = length =>
      length > postsAtStart.length ? postsAtStart.length : length;

    // Without authentication.
    describe('without authentication', () => {
      // Without query parameters.
      describe('without query parameters', () => {
        // Valid body.
        it('should return the first 20 posts by default fo valid body', async () => {
          const res = await getPosts()
            .expect(200)
            .expect(postsAtStart.slice(0, 20));
          expect(res.body).to.have.length(getLength(20));
        });

        // Invalid body.
        it('should return the first 20 posts by default for invalid body', async () => {
          const res = await getPosts()
            .send({ invalid: 'invalid' })
            .expect(200)
            .expect(postsAtStart.slice(0, 20));
          expect(res.body).to.have.length(getLength(20));
        });
      });

      // With valid query parameters.
      describe('with valid query parameters', () => {
        // Valid body.
        it('should return the first 20 posts for valid body when offset=0 limit=20', async () => {
          const res = await getPosts('?limit=20&offset=0')
            .expect(200)
            .expect(postsAtStart.slice(0, 20));
          expect(res.body).to.have.length(getLength(20));
        });

        // Invalid body.
        it('should return the first 20 posts for invalid body when offset=0 limit=20', async () => {
          const res = await getPosts('?limit=20&offset=0')
            .send({ invalid: 'invalid' })
            .expect(200)
            .expect(postsAtStart.slice(0, 20));
          expect(res.body).to.have.length(getLength(20));
        });

        // Valid body.
        it('should return the first 20 posts from offset 2 for valid body when offset=2', async () => {
          await getPosts('?offset=2')
            .expect(200)
            .expect(postsAtStart.slice(2, 22));
        });

        // Invalid body.
        it('should return the first 20 posts by default for invalid body when offset=2', async () => {
          await getPosts('?offset=2')
            .send({ invalid: 'invalid' })
            .expect(200)
            .expect(postsAtStart.slice(2, 22));
        });

        // Valid body.
        it('should return the empty array with offset >= numPosts for valid body', async () => {
          await getPosts(`?offset=${postsAtStart.length}`)
            .expect(200)
            .expect([]);
        });

        // Invalid body.
        it('should return the empty array with offset >= numPosts for invalid body', async () => {
          await getPosts(`?offset=${postsAtStart.length}`)
            .send({ invalid: 'invalid' })
            .expect(200)
            .expect([]);
        });
      });

      // With invvalid query parameters.
      describe('with invalid query parameters', () => {
        // Valid body.
        it('should return bad request for valid body when offset=-1', async () => {
          await getPosts('?offset=-1').expect(badRequest.code).expect({
            message: badRequest.message,
            detail: 'Offset must be less than 0, and limit between 0 and 100.',
          });
        });

        // Invalid body.
        it('should return bad request for invalid body when offset=-1', async () => {
          await getPosts('?offset=-1')
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail:
                'Offset must be less than 0, and limit between 0 and 100.',
            });
        });

        // Valid body.
        it('should return bad request for valid body when limit=-1', async () => {
          await getPosts('?limit=-1').expect(badRequest.code).expect({
            message: badRequest.message,
            detail: 'Offset must be less than 0, and limit between 0 and 100.',
          });
        });

        // Invalid body.
        it('should return bad request for invalid body when limit=-1', async () => {
          await getPosts('?limit=-1')
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail:
                'Offset must be less than 0, and limit between 0 and 100.',
            });
        });

        // Valid body.
        it('should return bad request for valid body when limit=101', async () => {
          await getPosts('?limit=101').expect(badRequest.code).expect({
            message: badRequest.message,
            detail: 'Offset must be less than 0, and limit between 0 and 100.',
          });
        });

        // Invalid body.
        it('should return bad request for invalid body when limit=101', async () => {
          await getPosts('?limit=101')
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail:
                'Offset must be less than 0, and limit between 0 and 100.',
            });
        });

        // Valid body.
        it('should return bad request for valid body when limit type is invalid', async () => {
          await getPosts('?limit=asdasd').expect(badRequest.code).expect({
            message: badRequest.message,
            detail: 'Limit and offset must be numeric values.',
          });
        });

        // Invalid body.
        it('should return bad request for invalid body when limit type is invalid', async () => {
          await getPosts('?limit=asdasd')
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail: 'Limit and offset must be numeric values.',
            });
        });
      });
    });

    describe('with authentication', () => {
      // Without query parameters.
      describe('without query parameters', () => {
        // Valid body.
        it('should return the first 20 posts by default fo valid body', async () => {
          const res = await getPostsAuth()
            .expect(200)
            .expect(postsAtStart.slice(0, 20));
          expect(res.body).to.have.length(getLength(20));
        });

        // Invalid body.
        it('should return the first 20 posts by default for invalid body', async () => {
          const res = await getPostsAuth()
            .send({ invalid: 'invalid' })
            .expect(200)
            .expect(postsAtStart.slice(0, 20));
          expect(res.body).to.have.length(getLength(20));
        });
      });

      // With valid query parameters.
      describe('with valid query parameters', () => {
        // Valid body.
        it('should return the first 20 posts for valid body when offset=0 limit=20', async () => {
          const res = await getPostsAuth('?limit=20&offset=0')
            .expect(200)
            .expect(postsAtStart.slice(0, 20));
          expect(res.body).to.have.length(getLength(20));
        });

        // Invalid body.
        it('should return the first 20 posts for invalid body when offset=0 limit=20', async () => {
          const res = await getPostsAuth('?limit=20&offset=0')
            .send({ invalid: 'invalid' })
            .expect(200)
            .expect(postsAtStart.slice(0, 20));
          expect(res.body).to.have.length(getLength(20));
        });

        // Valid body.
        it('should return the first 20 posts from offset 2 for valid body when offset=2', async () => {
          await getPostsAuth('?offset=2')
            .expect(200)
            .expect(postsAtStart.slice(2, 22));
        });

        // Invalid body.
        it('should return the first 20 posts by default for invalid body when offset=2', async () => {
          await getPostsAuth('?offset=2')
            .send({ invalid: 'invalid' })
            .expect(200)
            .expect(postsAtStart.slice(2, 22));
        });

        // Valid body.
        it('should return the empty array with offset >= numPosts for valid body', async () => {
          await getPostsAuth(`?offset=${postsAtStart.length}`)
            .expect(200)
            .expect([]);
        });

        // Invalid body.
        it('should return the empty array with offset >= numPosts for invalid body', async () => {
          await getPostsAuth(`?offset=${postsAtStart.length}`)
            .send({ invalid: 'invalid' })
            .expect(200)
            .expect([]);
        });
      });

      // With invvalid query parameters.
      describe('with invalid query parameters', () => {
        // Valid body.
        it('should return bad request for valid body when offset=-1', async () => {
          await getPostsAuth('?offset=-1').expect(badRequest.code).expect({
            message: badRequest.message,
            detail: 'Offset must be less than 0, and limit between 0 and 100.',
          });
        });

        // Invalid body.
        it('should return bad request for invalid body when offset=-1', async () => {
          await getPostsAuth('?offset=-1')
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail:
                'Offset must be less than 0, and limit between 0 and 100.',
            });
        });

        // Valid body.
        it('should return bad request for valid body when limit=-1', async () => {
          await getPostsAuth('?limit=-1').expect(badRequest.code).expect({
            message: badRequest.message,
            detail: 'Offset must be less than 0, and limit between 0 and 100.',
          });
        });

        // Invalid body.
        it('should return bad request for invalid body when limit=-1', async () => {
          await getPostsAuth('?limit=-1')
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail:
                'Offset must be less than 0, and limit between 0 and 100.',
            });
        });

        // Valid body.
        it('should return bad request for valid body when limit=101', async () => {
          await getPostsAuth('?limit=101').expect(badRequest.code).expect({
            message: badRequest.message,
            detail: 'Offset must be less than 0, and limit between 0 and 100.',
          });
        });

        // Invalid body.
        it('should return bad request for invalid body when limit=101', async () => {
          await getPostsAuth('?limit=101')
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail:
                'Offset must be less than 0, and limit between 0 and 100.',
            });
        });

        // Valid body.
        it('should return bad request for valid body when limit type is invalid', async () => {
          await getPostsAuth('?limit=asdasd').expect(badRequest.code).expect({
            message: badRequest.message,
            detail: 'Limit and offset must be numeric values.',
          });
        });

        // Invalid body.
        it('should return bad request for invalid body when limit type is invalid', async () => {
          await getPostsAuth('?limit=asdasd')
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail: 'Limit and offset must be numeric values.',
            });
        });

        // Valid body.
        it('should return bad request for valid body when offset type is invalid', async () => {
          await getPostsAuth('?offset=asdasd').expect(badRequest.code).expect({
            message: badRequest.message,
            detail: 'Limit and offset must be numeric values.',
          });
        });

        // Invalid body.
        it('should return bad request for invalid body when offset type is invalid', async () => {
          await getPostsAuth('?offset=asdasd')
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail: 'Limit and offset must be numeric values.',
            });
        });
      });
    });
  });

  /*************************
   ** CREATING A NEW POST **
   *************************/
  describe('[POST /api/posts] Creating a post', () => {
    const createPost = () => api.post('/api/posts');
    const createPostAuth = () => withToken(createPost(), token);

    let postToCreate = null;
    let postsAtStart = null;

    beforeEach('fetch initial posts', async () => {
      postsAtStart = await postsInDb();
    });

    beforeEach('randomize post to create', () => {
      postToCreate = getNewPost();
    });

    // Without authentication.
    describe('without authentication', () => {
      // Valid body.
      it('should return unauthorized for valid body', async () => {
        await createPost()
          .send(postToCreate)
          .expect(unauthorized.code)
          .expect({ message: unauthorized.message });

        // Make sure no post was created.
        const postsAtEnd = await postsInDb();
        expect(postsAtEnd).to.have.length(postsAtStart.length);
      });

      // Invalid body.
      it('should return unauthorized for invalid body', async () => {
        await createPost()
          .send({ ...removeField(postToCreate) })
          .expect(unauthorized.code)
          .expect({ message: unauthorized.message });

        // Make sure no post was created.
        const postsAtEnd = await postsInDb();
        expect(postsAtEnd).to.have.length(postsAtStart.length);
      });
    });

    // With authentication.
    describe('with authentication', () => {
      // Valid body.
      it('should create a post and return 200 for valid body', async () => {
        const res = await createPostAuth().send(postToCreate).expect(201);

        // Make sure created post was returned.
        expect(res.body).to.deep.include({ ...postToCreate, seller, location });

        // Make sure post was created.
        const createdPost = await Post.findById(res.body.id);
        expect(createdPost.toJSON()).to.deep.include({
          ...postToCreate,
          seller,
          location,
        });
        const postsAtEnd = await postsInDb();
        expect(postsAtEnd).to.have.length(postsAtStart.length + 1);
      });

      // Extranous body.
      it('should return bad request for body with extra fields', async () => {
        await createPostAuth()
          .send({ invalid: 'invalid', ...getNewPost() })
          .expect(badRequest.code)
          .expect({
            message: badRequest.message,
            detail: 'Extranous fields in body.',
          });

        // Make sure no post was created.
        const postsAtEnd = await postsInDb();
        expect(postsAtEnd).to.have.length(postsAtStart.length);
      });

      // Invalid body.
      it('should return bad request for invalid body', async () => {
        await createPostAuth()
          .send({ ...removeField(getNewPost()) })
          .expect(badRequest.code);

        // Make sure no post was created.
        const postsAtEnd = await postsInDb();
        expect(postsAtEnd).to.have.length(postsAtStart.length);
      });

      // Invalid fields.
      describe('with invalid fields', () => {
        // Helper function.
        const testInvalidPost = async body => {
          await createPostAuth().send(body).expect(badRequest.code);
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd).to.have.length(postsAtStart.length);
        };

        it('should not create a post with invalid title', async () => {
          await testInvalidPost({ ...getNewPost(), title: '' });
          await testInvalidPost({ ...getNewPost(), title: 1231203910231 });
          await testInvalidPost({ ...getNewPost(), title: 'asd' });
          await testInvalidPost({
            ...getNewPost(),
            title: 'asdasdaksljfjlasfljajsflkasjlflkasf',
          });
        });

        it('should not create a post with invalid description', async () => {
          await testInvalidPost({ ...getNewPost(), description: '' });
          await testInvalidPost({
            ...getNewPost(),
            description: 1232912031213,
          });
        });

        it('should not create a post with invalid category', async () => {
          await testInvalidPost({ ...getNewPost(), category: '' });
          await testInvalidPost({
            ...getNewPost(),
            category: 1232912031213,
          });
          await testInvalidPost({
            ...getNewPost(),
            category: 'I am not a category',
          });
        });

        it('should not create a post with invalid asking price', async () => {
          await testInvalidPost({ ...getNewPost(), askingPrice: 0.99 });
          await testInvalidPost({ ...getNewPost(), askingPrice: 10000000 });
        });
      });
    });
  });

  /******************************
   ** FETCHING A SPECIFIC POST **
   ******************************/
  describe('[GET /api/posts/:id] Fetching a post with id', () => {
    const getPost = postId => api.get(`/api/posts/${postId}`);
    const getPostAuth = postId => withToken(getPost(postId), token);

    // Invalid indentifier.
    describe('with invalid identifier', () => {
      // Without authentication.
      describe('without authentication', () => {
        // Non-existing id.
        it('should return not found for non-existing id', async () => {
          await getPost(fakeId())
            .expect(notFound.code)
            .expect({ message: notFound.message });
        });

        // Invalid id.
        it('should return not found for invalid id', async () => {
          await getPost('invalid-id')
            .expect(notFound.code)
            .expect({ message: notFound.message });
        });
      });

      // With authentication.
      describe('with authentication', () => {
        // Non-existing id.
        it('should return not found for non-existing id', async () => {
          await getPostAuth(fakeId())
            .expect(notFound.code)
            .expect({ message: notFound.message });
        });

        // Invalid id.
        it('should return not found for invalid id', async () => {
          await getPostAuth('invalid-id')
            .expect(notFound.code)
            .expect({ message: notFound.message });
        });
      });
    });

    // Valid identifier.
    describe('with valid identifier', () => {
      let postToView = null;

      // Randomize post to view.
      beforeEach('randomize post to view', async () => {
        const posts = await postsInDb();
        postToView = faker.random.arrayElement(posts);
      });

      // Without authentication.
      describe('without authentication', () => {
        // Valid body.
        it('should return the post for valid body', async () => {
          const res = await getPost(postToView.id)
            .expect(200)
            .expect(postToView);
          expect(res.body.id).to.equal(postToView.id);
        });

        // Invalid body.
        it('should return the post for invalid body', async () => {
          const res = await getPostAuth(postToView.id)
            .expect(200)
            .expect(postToView);
          expect(res.body.id).to.equal(postToView.id);
        });
      });

      // With authentication.
      describe('with authentication', () => {
        // Valid body.
        it('should return the post for valid body', async () => {
          const res = await getPostAuth(postToView.id)
            .expect(200)
            .expect(postToView);
          expect(res.body.id).to.equal(postToView.id);
        });

        // Invalid body.
        it('should return the post for invalid body', async () => {
          const res = await getPostAuth(postToView.id)
            .send({ invalid: 'invalid' })
            .expect(200)
            .expect(postToView);
          expect(res.body.id).to.equal(postToView.id);
        });
      });
    });
  });

  /**********************
   ** MODIFYING A POST **
   **********************/
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

          // Make sure no post was modified.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.eql(postsAtEnd);
        });

        // Invalid id.
        it('should return not found for invalid id', async () => {
          await modifyPost('invalid-id')
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was modified.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.eql(postsAtEnd);
        });
      });

      // With authentication.
      describe('with authentication', () => {
        // Non-existing id.
        it('should return not found for non-existing id', async () => {
          await modifyPost(fakeId())
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was modified.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.eql(postsAtEnd);
        });
        // Invalid id.
        it('should return not found for invalid id', async () => {
          await modifyPost('invalid-id')
            .expect(notFound.code)
            .expect({ message: notFound.message });

          // Make sure no post was modified.
          const postsAtEnd = await postsInDb();
          expect(postsAtStart).to.eql(postsAtEnd);
        });
      });
    });

    // Valid identifier.
    describe('with valid identifier', () => {
      let postToModify = null;

      // Get a valid post id.
      beforeEach('randomize post to modify', async () => {
        const userPosts = await ownerPostsInDb();
        postToModify = faker.random.arrayElement(userPosts);
      });

      // Without authentication.
      describe('without authentication', () => {
        // Valid body.
        it('should return unauthorized for valid body', async () => {
          await modifyPost(postToModify.id)
            .send({ ...getNewPost() })
            .expect(unauthorized.code)
            .expect({ message: unauthorized.message });

          // Make sure no post was modified.
          const postAfter = await Post.findById(postToModify.id);
          expect(postToModify).to.be.eql(postAfter.toJSON());
        });

        // Invalid body.
        it('should return unauthorized for invalid body', async () => {
          await modifyPost(postToModify.id)
            .send({ ...removeField(getNewPost()) })
            .expect(unauthorized.code)
            .expect({ message: unauthorized.message });

          // Make sure no post was modified.
          const postAfter = await Post.findById(postToModify.id);
          expect(postToModify).to.be.eql(postAfter.toJSON());
        });
      });

      // With authentication.
      describe('with authentication', () => {
        // Valid body.
        it('should modify a post and return 200 for valid body', async () => {
          const postProps = getNewPost();
          const res = await modifyPostAuth(postToModify.id)
            .send(postProps)
            .expect(200);

          // Make sure modified post was returned.
          expect(res.body).to.deep.include({ ...postProps, seller, location });

          // Make sure post was modified.
          const modifiedPost = await Post.findById(postToModify.id);
          expect(modifiedPost.toJSON()).to.deep.include({
            ...postProps,
            seller,
            location,
          });
        });

        // Extranous body.
        it('should return bad request for body with extra fields', async () => {
          await modifyPostAuth(postToModify.id)
            .send({ invalid: 'invalid', ...getNewPost() })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail: 'Extranous fields in body.',
            });

          // Make sure no post was modified.
          const postAfter = await Post.findById(postToModify.id);
          expect(postToModify).to.be.eql(postAfter.toJSON());
        });

        // Invalid body.
        it('should return bad request for invalid body', async () => {
          await modifyPostAuth(postToModify.id)
            .send({ ...removeField(getNewPost()) })
            .expect(badRequest.code);

          // Make sure no post was modified.
          const postAfter = await Post.findById(postToModify.id);
          expect(postToModify).to.be.eql(postAfter.toJSON());
        });

        // Unauthorized.
        it('should return forbidden if trying to modify post of other', async () => {
          const tempPosts = await otherPostsInDb();
          postToModify = faker.random.arrayElement(tempPosts);

          await modifyPostAuth(postToModify.id)
            .send(getNewPost())
            .expect(forbidden.code)
            .expect({ message: forbidden.message });

          // Make sure no post was modified.
          const postAfter = await Post.findById(postToModify.id);
          expect(postToModify).to.be.eql(postAfter.toJSON());
        });
      });
    });
  });

  /*********************
   ** DELETING A POST **
   *********************/
  describe('[DELETE /api/posts/:id] Deleting a post', () => {
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
        const posts = await ownerPostsInDb();
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
        it('should return no content and delete a post for valid body', async () => {
          await deletePostAuth(postToDelete.id)
            .send({ invalid: 'invalid' })
            .expect(204);

          // Make sure post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd).to.have.length(postsAtStart.length - 1);
          expect(postsAtEnd.map(p => p.id)).to.not.contain(postToDelete.id);
        });

        // Unauthorized.
        it('should return forbidden if trying to modify post of other', async () => {
          const tempPosts = await otherPostsInDb();
          postToDelete = faker.random.arrayElement(tempPosts);

          await deletePostAuth(postToDelete.id)
            .expect(forbidden.code)
            .expect({ message: forbidden.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd.map(p => p.id)).to.contain(postToDelete.id);
        });
      });
    });
  });

  /*********************
   ** SEARCHING POSTS **
   *********************/
  describe('[POST /api/posts/search] Searching posts', () => {
    // Helper functions.
    const search = () => api.post('/api/posts/search');
    const searchAuth = () => withToken(search(), token);

    let referencePost = null;
    let postsAtStart = null;

    beforeEach('fetch initial posts', async () => {
      postsAtStart = await postsInDb();
    });

    beforeEach('get valid post', async () => {
      referencePost = faker.random.arrayElement(postsAtStart);
    });

    // With authentication.
    describe('without authentication', () => {
      // Valid params.
      describe('with valid params', () => {
        // No params
        it('should return empty array for no params', async () => {
          await search().send().expect(200).expect([]);
        });

        // Based on country
        it('should return posts by country', async () => {
          await search()
            .send({ country: referencePost.location.country })
            .expect(200)
            .expect(
              postsAtStart.filter(
                ({ location: { country } }) =>
                  country === referencePost.location.country
              )
            );
        });
        // Based on city
        it('should return posts by city', async () => {
          await search()
            .send({ city: referencePost.location.city })
            .expect(200)
            .expect(
              postsAtStart.filter(
                ({ location: { city } }) => city === referencePost.location.city
              )
            );
        });
        // Based on category
        it('should return posts by category', async () => {
          await search()
            .send({ category: referencePost.category })
            .expect(200)
            .expect(
              postsAtStart.filter(
                post => post.category === referencePost.category
              )
            );
        });

        // Based on country and city
        it('should return posts by country and city', async () => {
          await search()
            .send({
              country: referencePost.location.country,
              city: referencePost.location.city,
            })
            .expect(200)
            .expect(
              postsAtStart.filter(
                ({ location: { country, city } }) =>
                  country === referencePost.location.country &&
                  city === referencePost.location.city
              )
            );
        });

        // Non existing city.
        it('should return empty array for nonexisting city', async () => {
          await search().send({ city: 'Random' }).expect(200).expect([]);
        });
      });

      // Invalid param.s
      describe('with invalid params', () => {
        // Based on country
        it('should return bad request for invalid country', async () => {
          await search()
            .send({ country: 3 })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });
        });
        // Based on posted
        it('should return bad request for invalid posted', async () => {
          await search()
            .send({ posted: Date.now().toString() })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail: 'Please provide posted in format YYYY-MM-DD.',
            });
        });
        // Based on city
        it('should return bad request for invalid city', async () => {
          await search()
            .send({ city: 3 })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });
        });
        // Based on category
        it('should return bad request for invalid category', async () => {
          await search()
            .send({ category: 3 })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });
        });
      });
    });

    // With authentication.
    describe('with authentication', () => {
      // Valid params.
      describe('with valid params', () => {
        // No params
        it('should return empty array for no params', async () => {
          await searchAuth().send().expect(200).expect([]);
        });

        // Based on country
        it('should return posts by country', async () => {
          await searchAuth()
            .send({ country: referencePost.location.country })
            .expect(200)
            .expect(
              postsAtStart.filter(
                ({ location: { country } }) =>
                  country === referencePost.location.country
              )
            );
        });
        // Based on city
        it('should return posts by city', async () => {
          await searchAuth()
            .send({ city: referencePost.location.city })
            .expect(200)
            .expect(
              postsAtStart.filter(
                ({ location: { city } }) => city === referencePost.location.city
              )
            );
        });
        // Based on category
        it('should return posts by category', async () => {
          await searchAuth()
            .send({ category: referencePost.category })
            .expect(200)
            .expect(
              postsAtStart.filter(
                post => post.category === referencePost.category
              )
            );
        });

        // Based on posted
        it('should return posts by posted', async () => {
          await searchAuth()
            .send({ posted: referencePost.posted })
            .expect(200)
            .expect(
              postsAtStart.filter(
                ({ posted }) => posted === referencePost.posted
              )
            );
        });

        // Based on country and city
        it('should return posts by country and city', async () => {
          await searchAuth()
            .send({
              country: referencePost.location.country,
              city: referencePost.location.city,
            })
            .expect(200)
            .expect(
              postsAtStart.filter(
                ({ location: { country, city } }) =>
                  country === referencePost.location.country &&
                  city === referencePost.location.city
              )
            );
        });

        // Non existing city.
        it('should return empty array for nonexisting city', async () => {
          await searchAuth().send({ city: 'Random' }).expect(200).expect([]);
        });
      });

      // Invalid param.s
      describe('with invalid params', () => {
        // Based on country
        it('should return bad request for invalid country', async () => {
          await searchAuth()
            .send({ country: 3 })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });
        });
        // Based on posted
        it('should return bad request for invalid posted', async () => {
          await searchAuth()
            .send({ posted: Date.now().toString() })
            .expect(badRequest.code)
            .expect({
              message: badRequest.message,
              detail: 'Please provide posted in format YYYY-MM-DD.',
            });
        });
        // Based on city
        it('should return bad request for invalid city', async () => {
          await searchAuth()
            .send({ city: 3 })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });
        });
        // Based on category
        it('should return bad request for invalid category', async () => {
          await searchAuth()
            .send({ category: 3 })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });
        });
      });
    });
  });

  /*****************************
   ** UPLOADING POST IMAGE(S) **
   *****************************/
  describe('[POST /api/posts/:id/upload] Uploading images', () => {
    let postsAtStart = null;
    let postForUpload = null;
    let filesAtStart = null;

    const upload = postId => api.post(`/api/posts/${postId}/upload`);
    const uploadAuth = postId => withToken(upload(postId), token);

    beforeEach('fetch initial posts', async () => {
      postsAtStart = await ownerPostsInDb();
    });

    beforeEach('randomize post', async () => {
      postForUpload = faker.random.arrayElement(postsAtStart);
    });

    beforeEach('create folder', async () => {
      try {
        await fs.mkdir(IMAGES_PATH);
      } catch {}
    });

    afterEach('delete files', async () => {
      try {
        await fs.rmdir(IMAGES_PATH, { recursive: true });
      } catch {}
    });

    it('should return not found for invalid id as unauthenticated', async () => {
      await upload(fakeId())
        .send()
        .expect(notFound.code)
        .expect({ message: notFound.message });
    });

    it('should require authentication', async () => {
      await upload(postForUpload.id)
        .send()
        .expect(unauthorized.code)
        .expect({ message: unauthorized.message });
    });

    it('should require authorization', async () => {
      const tempPosts = await otherPostsInDb();
      await uploadAuth(tempPosts[0].id)
        .send()
        .expect(forbidden.code)
        .expect({ message: forbidden.message });
    });

    // Nonexisting post.
    it('should not upload for post with invalid id', async () => {
      await uploadAuth(fakeId())
        .send()
        .expect(notFound.code)
        .expect({ message: notFound.message });

      expect(await fs.readdir(IMAGES_PATH)).to.have.length(0);
    });

    // Uploading one image.
    it('should upload attached image', async () => {
      await uploadAuth(postForUpload.id)
        .attach('fileName', './app/tests/1.png')
        .expect(200);

      expect(await fs.readdir(IMAGES_PATH)).to.have.length(1);
    });

    // Uploading multiple images.
    it('should upload attached images', async () => {
      const res = await uploadAuth(postForUpload.id)
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/index.jpg')
        .attach('fileName', './app/tests/1.png')
        .expect(200);
      expect(res.body).to.have.lengthOf(4);
      expect(res.body[0]).to.be.a('string');

      expect(await fs.readdir(IMAGES_PATH)).to.have.length(4);
    });

    // Uploading more than max num of images.
    it('should return a correct response type for invalid amount of images', async () => {
      await uploadAuth(postForUpload.id)
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .expect(badRequest.code)
        .expect({ message: badRequest.message, detail: 'Unexpected field' });

      expect(await fs.readdir(IMAGES_PATH)).to.have.length(0);
    });

    // Uploading files of
    it('should return a correct response type for invalid file type', async () => {
      await uploadAuth(postForUpload.id)
        .attach('fileName', './app/tests/empty.txt')
        .expect(badRequest.code)
        .expect({
          message: badRequest.message,
          detail: 'Make sure all the files are images.',
        });

      expect(await fs.readdir(IMAGES_PATH)).to.have.length(0);
    });

    // Removing images.
    it('should remove the images when none is provided', async () => {
      await uploadAuth(postForUpload.id)
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/index.jpg')
        .attach('fileName', './app/tests/1.png')
        .expect(200);

      expect(await fs.readdir(IMAGES_PATH)).to.have.length(4);

      await uploadAuth(postForUpload.id).send().expect(200).expect([]);
      expect(await fs.readdir(IMAGES_PATH)).to.have.length(0);
    });

    it('should remove the images when deleting a post', async () => {
      await uploadAuth(postForUpload.id)
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/1.png')
        .attach('fileName', './app/tests/index.jpg')
        .attach('fileName', './app/tests/1.png')
        .expect(200);

      expect(await fs.readdir(IMAGES_PATH)).to.have.length(4);

      await withToken(api.delete(`/api/posts/${postForUpload.id}`), token)
        .send()
        .expect(204);
      expect(await fs.readdir(IMAGES_PATH)).to.have.length(0);
    });
  });
});

after('Close DB connection.', () => {
  mongoose.connection.close();
});
