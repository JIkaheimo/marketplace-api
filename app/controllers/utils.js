//@ts-check

/**
 * This file contains some functions used
 * by multiple controllers that didn't have
 * any other place in the project structure...
 */

// Third-party modules.
import fs from 'fs/promises';
import path from 'path';

// In-house modules.
import { config } from '../utils/index.js';

/**
 * Deletes post images from the image folder.
 * @param {import('../types').Post} post
 * @returns {Promise<void>}
 */
export const deletePostImages = async post => {
  // Remove old images.
  const removePromises = post.imageUrls.map(imageUrl => {
    // Get the actual file part from the stored api path.
    const imagePathParts = imageUrl.split('/');
    const imagePath = imagePathParts[imagePathParts.length - 1];
    // Get the file location in the server.
    const imageFile = path.join(config.IMAGES_PATH, imagePath);
    // Remove the file.
    return fs.rm(imageFile);
  });

  await Promise.all(removePromises);
};
