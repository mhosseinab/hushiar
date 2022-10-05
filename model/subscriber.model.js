var mongoose = require('mongoose');

var SubscriberSchema = new mongoose.Schema({
  registerDate : Date,
  title: String,
  mobileNumber: String,
  device : {type: mongoose.Schema.Types.ObjectId, ref:'Device'},
  accessEndDate: Date,
});

module.exports = mongoose.model('Subscriber',SubscriberSchema);
