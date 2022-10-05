
var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
var awsConnection = '';
var localConnection = 'mongodb://localhost:27017/homeSecurity';
mongoose.connect(awsConnection,function(err){
  if(err){
    console.log(err);
  }else{
    console.log('connected to homeSecurity');
  }
});
