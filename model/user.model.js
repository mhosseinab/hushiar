var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  registerDate : Date,
  title: String,
  mobileNumber: String,
  email: String,
  isValid: Boolean,
  credit: Number,
  wpSubList: [{type: mongoose.Schema.Types.Mixed}],
  isMobileNumberConfirmed: Boolean,
  lastWPDateTime : Date,
  lastSMSDateTime : Date,
  credit:Number, // price
  storageMaxSize: Number, //mb
  storageUsedSize: Number, //mb
  storageRemainedSize: Number, //mb
  remaningDays:Number, // days
});

module.exports = mongoose.model('User',UserSchema);
