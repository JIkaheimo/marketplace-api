const { User, userSchema, addressSchema } = require("./user");

module.exports = {
  Post: require("./post"),
  User,
  userSchema,
  addressSchema,
};
