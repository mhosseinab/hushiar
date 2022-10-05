var kavenegarClient;


function sendSMS(sender,receptor,message){
  return new Promise(function(resolve, reject) {
    kavenegarClient.Send({
        message: message,
        sender: sender,
        receptor: receptor
    },
    function(response, status) {
        console.log(response);
        console.log(status);
        resolve(response);
    });
  });
}

function sendTemplatedSMS(template,receptor,token, token2, token3){
  return new Promise(function(resolve, reject) {
    kavenegarClient.VerifyLookup({
        token: token,
        token2: token2,
        token3: token3,
        template: template,
        receptor: receptor
    },
    function(response, status) {
        console.log(response);
        console.log(status);
        resolve(response);
    });
  });
}

exports = module.exports = function(options){
  kavenegarClient = options.kavenegarClient;

  this.sendSMS = sendSMS;
  this.sendTemplatedSMS = sendTemplatedSMS;
};
