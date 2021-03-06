/**
 * Routing/Controller module for hanling image
 * related requests.
 * @module controllers/images
 */

import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';
import { IMAGES_PATH } from '../utils/config.js';
import { notFoundError } from '../utils/errors.js';

const imagesRouter = Router();

// [GET] Gets path for all the image resources.
imagesRouter.get('/', async (req, res) => {
  // Read available image filenames from image folder.
  const filenames = await fs.readdir(IMAGES_PATH);
  const filepaths = filenames.map(name => `${req.fullPath}/${name}`);
  res.json(filepaths);
});

// [GET] Returns an image resource with the specified name.
imagesRouter.get('/:imageName', ({ params: { imageName } }, res, next) => {
  res
    .status(200)
    .sendFile(path.join(IMAGES_PATH, imageName), { root: '.' }, error => {
      if (error) next(notFoundError());
    });
});

export default imagesRouter;
