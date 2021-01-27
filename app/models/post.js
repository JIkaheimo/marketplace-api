const mongoose = require("mongoose");

const deliverySchema = mongoose.Schema(
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
  { _id: false }
);

const postSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
    cast: false,
  },
  title: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 25,
    cast: false,
  },
  category: {
    type: String,
    enum: ["computers", "electronics", "cars", "pets", "food", "drinks"],
    required: true,
    cast: false,
  },
  askingPrice: {
    type: Number,
    required: true,
    min: 1,
    max: 9999999,
    cast: false,
  },
  deliveryType: {
    type: deliverySchema,
    required: true,
  },
  posted: {
    type: Date,
    required: true,
    immutable: true,
    cast: false,
  },
});

postSchema.pre("findOneAndUpdate", function (next) {
  this.options.runValidators = true;
  next();
});

postSchema.set("toJSON", {
  transform: (document, post) => {
    post.id = post._id.toString();
    delete post._id;
    delete post.__v;
  },
});

module.exports = mongoose.model("Post", postSchema);
