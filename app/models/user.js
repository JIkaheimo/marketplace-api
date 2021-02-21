import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

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
  { _id: false }
);

export const userSchema = mongoose.Schema({
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
});

userSchema.virtual('token').get(function () {
  const userForToken = {
    username: this.username,
    id: this._id,
  };

  return jwt.sign(userForToken, process.env.SECRET);
});

userSchema.plugin(uniqueValidator, { message: '{PATH} already exists!' });

userSchema.pre('findOneAndUpdate', function (next) {
  this.options.runValidators = true;
  next();
});

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
};
