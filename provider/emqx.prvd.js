var mqttClient;
var subscribtionCallBackFunction;

function subscribeToTopicList(topicList){
  let promiseList = topicList.map(function(topic){
    return subscribeToTopic(topic);
  });

  return Promise.all(promiseList);

}

function subscribeToTopic(topic){
  return new Promise(function(resolve, reject) {
    mqttClient.subscribe(topic, function(err){
        if(err){
          reject(err);
        }else{
          resolve(`subscribed to ${topic} on emqx`);
        }
      });
  });

}

function unsubscribeToTopic(topic){
  return new Promise(function(resolve, reject) {
    mqttClient.subscribe(topic, function(err){
        if(err){
          reject(err);
        }else{
          resolve(`unsubscribeToTopic to ${topic} on emqx`);
        }
      });
  });

}

function publish(topic, value){
  console.log(`publish ${topic} -> ${value}`);
  mqttClient.publish(topic, value);
}

function processMessage(topic, message){
  //console.log(`message on emqx ${message}`);
  subscribtionCallBackFunction(topic, message);
}

function setSubscribtionCallBackFunction(callBackFunction){
  subscribtionCallBackFunction = callBackFunction;
}


exports = module.exports = function(options){
  mqttClient = options.mqttClient;
  if(mqttClient){
    mqttClient.on('connect', function () {
      console.log('emqx Clien Connected');
    });

    mqttClient.on('close', function () {
      console.log('emqx Clien closeed');
    });

    mqttClient.on('disconnect', function () {
      console.log('emqx Clien disconnected');
    });

    mqttClient.on('offline', function () {
      console.log('emqx Clien offline');
    });

    mqttClient.on('error', function (error) {
      console.log('emqx Clien error : '+ error);
    });

    mqttClient.on('message', processMessage);
  }

  this.subscribeToTopicList = subscribeToTopicList;
  this.subscribeToTopic = subscribeToTopic;
  this.unsubscribeToTopic = unsubscribeToTopic;
  this.setSubscribtionCallBackFunction = setSubscribtionCallBackFunction;
  this.publish = publish;
};
