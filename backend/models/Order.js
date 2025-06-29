const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  customerName: String,
  productType: String,
  quantity: Number,
  price: Number,
  status: String,
  orderDate: Date,
  deliveryDate: Date,
  mobile: Number,
  address: String,
  city: String,
});
module.exports = mongoose.model('Order', OrderSchema);