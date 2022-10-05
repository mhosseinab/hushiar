var kavenegarProvider;
var setLastSMSDateTimeFunction;

function sendVerificationCode(mobileNumber,confirmationCode){
  return kavenegarProvider.sendTemplatedSMS('hushiarVerification', mobileNumber,confirmationCode);
}

function sendMovingAlert(user, deviceTitle){
  return new Promise(function(resolve, reject) {
    if(!user.lastSMSDateTime){
      setLastSMSDateTimeFunction(user._id, new Date().getTime())
        .then(function(updatedUser){
          console.log(updatedUser);
          kavenegarProvider.sendTemplatedSMS('hushiarMoving', user.mobileNumber,deviceTitle)
            .then(function(sendSmsResponse){
              resolve(sendSmsResponse);
            })
            .catch(function(err){
              reject(err)
            })
        })
        .catch(function(err){
          reject(err);
        });
    }else{
      let lastSMSDateTime = user.lastSMSDateTime;
      let secondDiffrence = (new Date().getTime() - new Date(lastSMSDateTime).getTime())/1000;
      if(secondDiffrence > 60){
        setLastSMSDateTimeFunction(user._id, new Date().getTime())
          .then(function(updatedUser){
            console.log(updatedUser);
            kavenegarProvider.sendTemplatedSMS('hushiarMoving', user.mobileNumber,deviceTitle)
              .then(function(sendSmsResponse){
                resolve(sendSmsResponse);
              })
              .catch(function(err){
                reject(err)
              })
          })
          .catch(function(err){
            reject(err);
          });
      }else{
        //do nothing: user get sms recently
        resolve('User Get SMS Recently')
      }
    }
  });

}


exports = module.exports = function(options){
    kavenegarProvider = options.kavenegarProvider;
    setLastSMSDateTimeFunction = options.setLastSMSDateTimeFunction;

    this.sendVerificationCode = sendVerificationCode;
    this.sendMovingAlert = sendMovingAlert;
};
