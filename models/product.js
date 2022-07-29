const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const defineSchema = {
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
};

const productSchema = new Schema(defineSchema);

module.exports = mongoose.model('Product', productSchema);
