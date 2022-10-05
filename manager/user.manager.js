var User;
var webpush;

function create(title, mobileNumber){
  var newUser = new User({
    title: title,
    mobileNumber: mobileNumber,
    registerDate: new Date(),
    isValid: true,
    credit: 1000000,
  });
  return newUser.save();
}

function create_mobileNumber(mobileNumber){
  let newUser = new User({
    mobileNumber:mobileNumber
  });

  return newUser.save();
}

function get(userId){
  var query = {
    _id: userId
  };

  return User.findOne(query);
}

function addWebPushSub(userId, sub){
  var query = {
    _id: userId
  };

  var update = {
    $push : { wpSubList : sub }
  };

  return User
    .findOneAndUpdate(query, update, {new: true});
}

function webPushNotify(userId , device){
  var query = {
    _id: userId
  };

  return new Promise(function(resolve, reject) {
    User.findOne(query)
      .then(function(foundUser){
        if(foundUser){
          let lastWPDateTime = foundUser.lastWPDateTime;
          let secondDiffrence = (new Date().getTime() - new Date(foundUser.lastWPDateTime).getTime())/1000;
          console.log('secondDiffrence: ' + secondDiffrence);
          if(secondDiffrence > 60){
            foundUser.wpSubList.forEach(function(wpSub){
              var message = generateWebPushMessage(`تشخیص حرکت در ${device.title}`,device._id);
              webpush.sendNotification(wpSub,JSON.stringify(message))
                .then(function(response){
                  console.log('web push response');
                  setLastWPDateTime(foundUser._id, new Date())
                    .then(function(updatedUser){
                      console.log(updatedUser);
                    })
                    .catch(function(err){
                      console.log(err);
                    })
                  console.log(response);
                  resolve(response);
                })
                .catch(function(err){
                  console.log('web push error');
                  console.log(err);
                  reject(err);
               });
              resolve('feke done');
            });
          }

        }else{
          reject(new Error('No User Found With ID : '+ userId));
        }
      })
      .catch(function(err){
        reject(err);
      });
  });

}

function webPushNotifyMessage(userId , title, message){
  var query = {
    _id: userId
  };

  return new Promise(function(resolve, reject) {
    User.findOne(query)
      .then(function(foundUser){
        if(foundUser){

            foundUser.wpSubList.forEach(function(wpSub){
              var message = generateWebPushMessageObject(title, message,undefined,undefined);
              webpush.sendNotification(wpSub,JSON.stringify(message))
                .then(function(response){
                  console.log('web push response');
                  console.log(response);
                  resolve(response);
                })
                .catch(function(err){
                  console.log('web push error');
                  console.log(err);
                  reject(err);
               });
              resolve('feke done');
            });

        }else{
          reject(new Error('No User Found With ID : '+ userId));
        }
      })
      .catch(function(err){
        reject(err);
      });
  });

}

function updateInfo(userId, title, email){
  let query = {
    _id: userId
  };

  let update = {
    title: title,
    email: email
  };

  return User.findOneAndUpdate(query, update, { new: true });
}

function get_mobileNumber(mobileNumber){
  return new Promise(function(resolve, reject) {
    let query = {mobileNumber: mobileNumber};
    User
      .findOne(query)
      .exec(function(err,foundUser){
        if(err){
          reject(err);
        }
        resolve(foundUser);
      });
  });
}

function generateWebPushMessage(message, deviceId){
  let notificationUrl = `https://panel.hushiar.com/deviceDetail;deviceId=${deviceId.toString()}/logList`;
  var notificationPayload = {
        "notification": {
            "title": "اخطار",
            "body": message,
            "icon": "https://cdn.hushiar.com/Logo.png",
            "vibrate": [100, 50, 100],
            "sound": "https://cdn.hushiar.com/moving.mp3",
            "data": {
                "dateOfArrival": Date.now(),
                "primaryKey": 1,
                "url": notificationUrl
            },
            "actions": [{
                "action": "view",
                "title": "مشاهده اخطار"
            }]
        }
    };

  return notificationPayload;
}

function generateWebPushMessageObject(title, message, notificationUrl,actionList){
  var notificationPayload = {
        "notification": {
            "title": title,
            "body": message,
            "icon": "https://cdn.hushiar.com/Logo.png",
            "vibrate": [100, 50, 100],
            "sound": "https://cdn.hushiar.com/moving.mp3",
            "data": {
                "dateOfArrival": Date.now(),
                "primaryKey": 1,
                "url": notificationUrl
            },
            "actions": actionList
        }
    };

  return notificationPayload;
}

function validateMobileNumber(userId){
  let query = {
      _id: userId
  };
  let update = {
    $set: { isMobileNumberConfirmed: true }
  };
  return User.findOneAndUpdate(query, update , {new: true});
}

function setLastWPDateTime(userId, lastWPDateTime){
  let query = {
      _id: userId
  };
  let update = {
    lastWPDateTime : lastWPDateTime
  };
  return User.findOneAndUpdate(query, update , {new: true});
}

function setLastSMSDateTime(userId, lastSMSDateTime){
  let query = {
      _id: userId
  };
  let update = {
    lastSMSDateTime : lastSMSDateTime
  };
  return User.findOneAndUpdate(query, update , {new: true});
}

function getAll(){
  var query = {};

  return User.find(query);
}

function setRemaningDays(userId, remaningDays){
  let query = {
    _id: userId
  };

  let update = {
    remaningDays: remaningDays,
  };

  return User.findOneAndUpdate(query, update, { new: true });
}

function setStorageMaxSize(userId, storageMaxSize){
  let query = {
    _id: userId
  };

  let update = {
    storageMaxSize: storageMaxSize,
  };

  return User.findOneAndUpdate(query, update, { new: true });
}

function setStorageUsage(userId, storageUsedSize, storageRemainedSize){
  let query = {
    _id: userId
  };

  let update = {
    storageUsedSize: storageUsedSize,
    storageRemainedSize:storageRemainedSize,
  };

  return User.findOneAndUpdate(query, update, { new: true });
}

function updateRemainingDays(userId, changesValue){

  let query = {
    _id: userId
  };

  let update = {
    "$inc": {
      "remaningDays": changesValue
    }
  };

  return User.findOneAndUpdate(query, update, { new: true });
}

exports = module.exports = function(options){
  User = options.userModel;
  webpush = options.webpush;

  this.create = create;
  this.updateInfo = updateInfo;
  this.create_mobileNumber = create_mobileNumber;
  this.get = get;
  this.addWebPushSub = addWebPushSub;
  this.webPushNotify = webPushNotify;
  this.webPushNotifyMessage = webPushNotifyMessage;
  this.get_mobileNumber = get_mobileNumber;
  this.validateMobileNumber = validateMobileNumber;
  this.setLastWPDateTime = setLastWPDateTime;
  this.setLastSMSDateTime = setLastSMSDateTime;
  this.getAll = getAll;
  this.setRemaningDays = setRemaningDays;
  this.setStorageMaxSize = setStorageMaxSize;
  this.setStorageUsage = setStorageUsage;
  this.updateRemainingDays = updateRemainingDays;
};
