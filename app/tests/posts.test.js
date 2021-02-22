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
import { post, removeField, user } from './data.js';

const { unauthorized, notFound, badRequest, forbidden } = ERRORS;

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
        const res = await createPostAuth().send(postToCreate).expect(200);

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
          .expect({ message: badRequest.message });

        // Make sure no post was created.
        const postsAtEnd = await postsInDb();
        expect(postsAtEnd).to.have.length(postsAtStart.length);
      });

      // Invalid body.
      it('should return bad request for invalid body', async () => {
        await createPostAuth()
          .send({ ...removeField(getNewPost()) })
          .expect(badRequest.code)
          .expect({ message: badRequest.message });

        // Make sure no post was created.
        const postsAtEnd = await postsInDb();
        expect(postsAtEnd).to.have.length(postsAtStart.length);
      });

      // Invalid fields.
      describe('with invalid fields', () => {
        // Helper function.
        const testInvalidPost = async body => {
          await createPostAuth()
            .send(body)
            .expect(badRequest.code)
            .expect({ message: badRequest.message });
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd).to.have.length(initialPosts.length);
        };

        it('should not create a post with invalid title', async () => {
          await testInvalidPost({ ...getNewPost(), title: '' });
          await testInvalidPost({ ...getNewPost(), title: 1231203910231 });
          await testInvalidPost({ ...getNewPost(), title: 'asd' });
          await testInvalidPost({
            ...initialPosts[0],
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
    const getPost = id => api.get(`/api/posts/${id}`);
    const getPostAuth = withToken(getPost(), token);

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
        postToModify = faker.random.arrayElement(postsAtStart);
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
            .expect({ message: badRequest.message });

          // Make sure no post was modified.
          const postAfter = await Post.findById(postToModify.id);
          expect(postToModify).to.be.eql(postAfter.toJSON());
        });

        // Invalid body.
        it('should return bad request for invalid body', async () => {
          await modifyPostAuth(postToModify.id)
            .send({ ...removeField(getNewPost()) })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });

          // Make sure no post was modified.
          const postAfter = await Post.findById(postToModify.id);
          expect(postToModify).to.be.eql(postAfter.toJSON());
        });

        // Unauthorized.
        it('should return forbidden if trying to modify post of other', async () => {
          postToModify = new Post(post(user('random')));
          await postToModify.save();
          await modifyPostAuth(postToModify.id)
            .send(getNewPost())
            .expect(forbidden.code)
            .expect({ message: forbidden.message });

          // Make sure no post was modified.
          const postAfter = await Post.findById(postToModify.id);
          expect(postToModify.toJSON()).to.be.eql(postAfter.toJSON());
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
        it('should return bad request for invalid body', async () => {
          await deletePostAuth(postToDelete.id)
            .send({ invalid: 'invalid' })
            .expect(badRequest.code)
            .expect({ message: badRequest.message });

          // Make sure no post was deleted.
          const postsAtEnd = await postsInDb();
          expect(postsAtEnd).to.have.length(postsAtStart.length);
        });

        // Unauthorized.
        it('should return forbidden if trying to modify post of other', async () => {
          postToDelete = new Post(post(user('random')));
          await postToDelete.save();
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
