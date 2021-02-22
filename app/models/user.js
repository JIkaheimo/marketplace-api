import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

/**
 * Address Mongoose schema.
 */
export const addressSchema = mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
  },
  { _id: false, strict: 'throw' }
);

/**
 * User Mongoose schema.
 */
export const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: [true, 'User with that username aready exists!'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    creationDate: {
      type: Date,
      required: true,
    },
    address: {
      type: addressSchema,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
  },
  { strict: 'throw' }
);

/**
 * Returns seller info from the given user.
 * @param {import('../types').User} user
 * @returns {import('../types').Seller}
 */
export const getSeller = ({ email, phoneNumber, username }) => ({
  email,
  phoneNumber,
  username,
});

/**
 * Returns location info from the given user.
 * @param {import('../types').User} user
 * @returns {import('../types').Address}
 */
export const getLocation = ({ address }) => ({ ...address });

userSchema.virtual('token').get(function () {
  const userForToken = {
    username: this.username,
    id: this._id,
  };

  return jwt.sign(userForToken, process.env.SECRET);
});

// Add unique validator for email and username.
userSchema.plugin(uniqueValidator, { message: '{PATH} already exists!' });

// Validators should be run when saving models.
userSchema.pre('findOneAndUpdate', function (next) {
  this.options.runValidators = true;
  next();
});

// Remove any private data when sending data as JSON.
userSchema.set('toJSON', {
  transform: (document, user) => {
    user.id = user._id.toString();
    delete user._id;
    delete user.__v;
    delete user.passwordHash;
    delete user.token;
  },
});

export const User = mongoose.model('User', userSchema);

export default {
  User,
  userSchema,
  addressSchema,
  getLocation,
  getSeller,
};
