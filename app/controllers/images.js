/**
 * Routing/Controller module for hanling image
 * related requests.
 * @module controllers/images
 */

import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';

const imagesRouter = Router();

const IMAGES_PATH = path.join('.', '..', '..', 'images');

// [GET] Gets path for all the image resources.
imagesRouter.get('/', async (req, res) => {
  // Read available image filenames from image folder.
  const filenames = await fs.readdir(IMAGES_PATH);

  const filepaths = filenames.map(name => `${req.fullPath}/${name}`);
  res.json({ images: filepaths });
});

// [GET] Returns an image resource with the specified name.
imagesRouter.get('/:imageName', async (req, res) => {
  const imageName = req.params.imageName;
  res.sendFile(path.join(IMAGES_PATH, imageName));
});

export default imagesRouter;
