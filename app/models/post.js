import mongoose from 'mongoose';

import { addressSchema } from './index.js';
import { default as validator } from 'validator';
import {} from 'moment';

/**
 * Schema of delivery type.
 */
export const deliverySchema = mongoose.Schema(
  {
    shipping: {
      type: Boolean,
      required: true,
      cast: false,
    },
    pickup: {
      type: Boolean,
      required: true,
      cast: false,
    },
  },
  { _id: false, strict: 'throw' }
);

/**
 * Schema of post seller.
 */
export const sellerSchema = mongoose.Schema(
  {
    // Phone number of the seller.
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      validate: [validator.isEmail],
    },
    username: {
      type: String,
      required: true,
    },
  },
  { _id: false, strict: 'throw' }
);

/**
 * Schema of post.
 */
export const postSchema = mongoose.Schema(
  {
    // Description of the post.
    description: {
      type: String,
      required: true,
      cast: false,
    },
    // Title of the post.
    title: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 25,
      cast: false,
    },
    // Category of the post.
    category: {
      type: String,
      enum: ['computers', 'electronics', 'cars', 'pets', 'food', 'drinks'],
      required: true,
      cast: false,
    },
    // Asking price of the post.
    askingPrice: {
      type: Number,
      required: true,
      min: 1,
      max: 9999999,
      cast: false,
    },
    // Delivery type of the post.
    deliveryType: {
      type: deliverySchema,
      required: true,
      cast: false,
    },
    imageUrls: {
      type: [
        {
          type: String,
        },
      ],
      validate: value => value.length <= 4,
    },
    posted: {
      type: Date,
      required: true,
      immutable: true,
      cast: false,
    },
    // Location of the post.
    location: {
      type: addressSchema,
      required: true,
    },
    // Seller of the post.
    seller: {
      type: sellerSchema,
      required: true,
    },
  },
  { strict: 'throw' }
);

// Run validators when creating or updating an item.
postSchema.pre('findOneAndUpdate', function (next) {
  this.options.runValidators = true;
  next();
});

// Remove extra fields when convertint to JSON.
postSchema.set('toJSON', {
  transform: (document, post) => {
    post.id = post._id.toString();
    delete post._id;
    delete post.__v;
  },
});

export const Post = mongoose.model('Post', postSchema);

export default { Post, deliverySchema, postSchema, sellerSchema };
