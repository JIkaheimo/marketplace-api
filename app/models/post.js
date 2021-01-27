const mongoose = require("mongoose");

const deliverySchema = mongoose.Schema(
  {
    shipping: {
      type: Boolean,
      required: true,
    },
    pickup: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const postSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 25,
  },
  category: {
    type: String,
    enum: ["computers", "electronics", "cars", "pets", "food", "drinks"],
    required: true,
  },
  askingPrice: {
    type: Number,
    required: true,
    min: 1,
    max: 9999999,
  },
  deliveryType: {
    type: deliverySchema,
    required: true,
  },
  posted: {
    type: Date,
  },
});

postSchema.set("toJSON", {
  transform: (document, post) => {
    post.id = post._id.toString();
    delete post._id;
    delete post.__v;
  },
});

module.exports = mongoose.model("Post", postSchema);
