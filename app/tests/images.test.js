//@ts-check

import fs from 'fs/promises';
import { default as chai } from 'chai';
const { expect } = chai;
import supertest from 'supertest';
import faker from 'faker';

import app from '../server.js';

import { IMAGES_PATH } from '../utils/config.js';
import { fakeId } from './helpers.js';
import { notFound } from '../constants.js';

const NUM_IMAGES = 10;

const api = supertest(app);

describe('While handling image requests', () => {
  /***********************
   * FETCHING ALL IMAGES *
   ***********************/
  describe('[GET /api/images] Fetching all images', () => {
    const getImages = () => api.get('/api/images');

    describe('when there is no images', () => {
      // No images.
      it('should return empty array', async () => {
        await getImages().expect(200).expect([]);
      });
    });

    describe('when there is images', () => {
      beforeEach('create folder', async () => {
        try {
          await fs.mkdir(IMAGES_PATH);
        } catch {}
      });

      beforeEach('add test images', async () => {
        await Promise.all(
          Array(NUM_IMAGES)
            .fill()
            .map(_ =>
              fs.copyFile('./app/tests/1.png', `${IMAGES_PATH}/${fakeId()}.png`)
            )
        );
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

      it('should return all the image paths', async () => {
        const res = await getImages().expect(200);
        expect(res.body).to.have.lengthOf(NUM_IMAGES);
      });
    });
  });

  /*****************************
   * FETCHING A SPECIFIG IMAGE *
   *****************************/
  describe('[GET /api/images/:imageName] Fetching specific image', () => {
    const getImage = id => api.get(`/api/images/${id}`);

    describe('with invalid name', () => {
      it('should return not found', async () => {
        await getImage('asdasdad')
          .expect(notFound.code)
          .expect({ message: notFound.message });
      });
    });

    describe('with valid name', () => {
      let names = null;

      beforeEach('create folder', async () => {
        try {
          await fs.mkdir(IMAGES_PATH);
        } catch {}
      });

      beforeEach('add test images', async () => {
        names = Array(NUM_IMAGES)
          .fill()
          .map(_ => `${fakeId()}.png`);
        await Promise.all(
          names.map(name =>
            fs.copyFile('./app/tests/1.png', `${IMAGES_PATH}/${name}`)
          )
        );
      });

      afterEach('delete files', async () => {
        try {
          await fs.rmdir(IMAGES_PATH, { recursive: true });
        } catch {}
      });

      it('should return image', async () => {
        await getImage(faker.random.arrayElement(names)).expect(
          'content-type',
          'image/png'
        );
      });
    });
  });
});
