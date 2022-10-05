var Subscriber;

function add(device, title, mobileNumber){
  var newSubscriber = new Subscriber({
    registerDate: new Date(),
    title: title,
    mobileNumber: mobileNumber,
    device: device
  });

  return newSubscriber.save();
}

function getAll_device(device){
  var query = {
    device:device
  };

  return Subscriber.find(query);
}

function remove(deviceId, subscriberId){
  var query = {
    _id: subscriberId,
    device:deviceId
  };

  return Subscriber.findOneAndDelete(query,{rawResult:true});
}

exports = module.exports = function(options){
  Subscriber = options.subscriberModel;

  this.add = add;
  this.getAll_device = getAll_device;
  this.remove = remove;
};
