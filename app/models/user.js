import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import validator from 'validator';

const isValidDate = dateString => {
  var regEx = /^\d{4}-\d{2}-\d{2}$/;
  return dateString.match(regEx) != null;
};

/**
 * Schema of address.
 */
export const addressSchema = mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      cast: false,
    },
    country: {
      type: String,
      required: true,
      cast: false,
    },
    postalCode: {
      type: String,
      required: true,
      cast: false,
    },
    street: {
      type: String,
      required: true,
      cast: false,
    },
  },
  { _id: false, strict: 'throw' }
);

/**
 * Schema of user.
 */
export const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      validate: validator.isEmail,
      cast: false,
    },
    username: {
      type: String,
      required: true,
      unique: [true, 'User with that username aready exists!'],
      cast: false,
    },
    passwordHash: {
      type: String,
      required: true,
      cast: false,
    },
    birthDate: {
      type: String,
      required: true,
      validator: isValidDate,
      cast: false,
    },
    creationDate: {
      type: String,
      required: true,
      validate: isValidDate,
      cast: false,
    },
    address: {
      type: addressSchema,
      required: true,
      cast: false,
    },
    phoneNumber: {
      type: String,
      required: true,
      cast: false,
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
    user.creationDate = user.creationDate.toString();
    user.birthDate = user.birthDate.toString();
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
