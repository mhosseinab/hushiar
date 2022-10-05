var mongoose = require('mongoose');

var AuthSchema = new mongoose.Schema(
  {
    authToken: Number,
    createDate: Date,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subscriber: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber' },
    enterDate: Date
  }
);

module.exports = mongoose.model('Auth',AuthSchema);
