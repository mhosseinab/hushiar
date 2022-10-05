var mongoose = require('mongoose');

var DeviceTypeSchema = new mongoose.Schema({
  title: String,
  price: Number,
  payablePrice:Number,
  description: String,
  headImage: String,
  imageList: [String],
  isAvaliable: Boolean,
});

module.exports = mongoose.model('DeviceType',DeviceTypeSchema);
