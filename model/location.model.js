var mongoose = require('mongoose');

var LocationSchema = new mongoose.Schema({
  registerDate : Date,
  title: String,
  address: String,
  user : {type: mongoose.Schema.Types.ObjectId, ref:'User'},
});

module.exports = mongoose.model('Location',LocationSchema);
