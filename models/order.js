const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const defineSchema = {
  products: [
    {
      product: { type: Object, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  user: {
    name: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  }
};

const orderSchema = new Schema(defineSchema);

module.exports = mongoose.model('Order', orderSchema);
