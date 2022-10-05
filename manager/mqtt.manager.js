var hivemqProvider;
var privateHivemqProvider;
var emqxProvider;
var hushiarProvider;

var subscribtionCallBackFunction;
var registerCallBackFunction;
var uploadImageCallBackFunction;
var movingCallBackFunction;

var providerList = [];

const PREFIX_TOPIC = 'HSHYR';
const REGISTER_TOPIC = 'HSHYR_register';
const SENSOR_TOPIC_LIST = ['Detector'];
const ACTUATOR_TOPIC_LIST = ['Capture', 'Buzzer', 'Beacon'];
const IMAGE_TOPIC = 'Image';
const MOVING_TOPIC = 'Moving';
const RESOLUTION_TOPIC = 'resolution';


const subscribeTopicList = [
  REGISTER_TOPIC,
];

function setToken(deviceManufactureId, token){
  let topic = `${PREFIX_TOPIC}_${deviceManufactureId}/setToken` ;
  console.log(`${topic}-> ${token}`);

  providerList.forEach((provider, i) => {
    provider.publish(topic, token);
  });
}

function setStatus(token, type ,status){
  let topic = `${PREFIX_TOPIC}_${token}/sub/${type}`;
  console.log(topic);
  providerList.forEach((provider, i) => {
    provider.publish(topic, status? '1': '0');
  });
}

function setResolution(token, resolution){
  let topic = `${PREFIX_TOPIC}_${token}/sub/resolution`;
  console.log(topic);
  providerList.forEach((provider, i) => {
    provider.publish(topic, resolution.toString());
  });
}

function publish(device, actuator, sensor , message){
  let topic = translateToTopic(device,actuator, sensor);
  console.log(`publish ${topic}`);
  providerList.forEach((provider, i) => {
    provider.publish(topic, message);
  });
}


function translateToTopic(device, actuator, sensor){
  // reuslt  deviceTOKEN/device.mangufatureId/actuator.manufatureId
  //return result;
  if(actuator){
    if(actuator.type == 'Capture'){
      return SET_RECORDING_TOPIC;
    }else if(actuator.type == 'Light'){
      return SET_LIGHT_TOPIC;
    }else if(actuator.type == 'Buzzer'){
      return SET_BUZZER_TOPIC;
    }else if(actuator.type == 'hazardBeacon'){
      return SET_BEACON_TOPIC;
    }
  }else if(sensor){
    if(sensor.type == 'motionDetector'){
      return SET_MONITORING_TOPIC;
    }
  }


}

function exctractTokenFromTopicParameter(topicParameter){
  let result = topicParameter.substring(PREFIX_TOPIC.length + 1)
  return result;
}

function translateTopic(topic){
  //console.log(`in taranslte ${topic}`);




  let result = {
    method: undefined,
    token : undefined,
    type : undefined,
    sensorManufactureId : undefined,
  };

  let params = topic.split("/");
  console.log(params);

  //Token
  if(params[0]){
    if(params[0].toString().trim()==REGISTER_TOPIC){
      result.method = 'register';
    }else{
      if(
        params[1] &&
        params[1] == 'pub' &&
        params[2]
      ){
        result.method = 'action';
        result.token = exctractTokenFromTopicParameter(params[0]);
        let type = params[2].toString().trim();
        if(type == IMAGE_TOPIC){
          result.method = 'uploadImage';
          //new Image
        }else if(type == MOVING_TOPIC){
          result.method = 'moving';
          result.type = 'Detector';
          //moving status
        }else if( SENSOR_TOPIC_LIST.includes(type)){
          //sensor
          result.method = 'action';
          result.type = type;
        }else if( ACTUATOR_TOPIC_LIST.includes(type)){
          result.method = 'action';
          result.type = type;
        }else if( type == RESOLUTION_TOPIC){
          result.method = 'resolotion';
        }else {
          //invalid topic
        }
      }

    }
  }

  return result;
}


function handelSubscribtion(topic, message){
  let translatedTopic = translateTopic(topic);
  console.log(translatedTopic);
  if(translatedTopic.method == 'register'){
    if(registerCallBackFunction){
      registerCallBackFunction(message);
    }
  }else if(translatedTopic.method == 'uploadImage'){
    if(uploadImageCallBackFunction){
      console.log('mqtt manager:: we are here to upload image');
      uploadImageCallBackFunction(translatedTopic.token, message);
    }
  }else if(translatedTopic.method == 'moving'){
    console.log('!!!!!Moving -> '+ message);
    if(registerCallBackFunction){
      movingCallBackFunction(translatedTopic, message== '0' ? false: true);
    }
  }else if(translatedTopic.method == 'action'){
    if(subscribtionCallBackFunction){
        subscribtionCallBackFunction(translatedTopic, message == '0'? false: true);
    }
  }

}


function setSubscribtionCallBackFunction(callBackFunction){
  subscribtionCallBackFunction = callBackFunction;
}

function setRegisterDeviceCallBackFunction(callBackFunction){
  registerCallBackFunction = callBackFunction;
}

function setUploadImageCallBackFunction(callBackFunction){
  uploadImageCallBackFunction = callBackFunction;
}

function setMovingCallBackFunction(callBackFunction){
  movingCallBackFunction = callBackFunction;
}

function subscribeDeviceTopic(deviceToken){
  providerList.forEach((provider, i) => {
    provider.subscribeToTopic(`${PREFIX_TOPIC}_${deviceToken}/pub/#`);
  });
  return new Promise(function(resolve, reject) {
    resolve("subscribed to mqtt Provider List");
  });
}

exports = module.exports = function(options){
  hivemqProvider = options.hivemqProvider;
  emqxProvider = options.emqxProvider;
  hushiarProvider = options.hushiarProvider;
  privateHivemqProvider = options.privateHivemqProvider;

  hivemqProvider.subscribeToTopicList(subscribeTopicList);
  hivemqProvider.setSubscribtionCallBackFunction(handelSubscribtion);

  privateHivemqProvider.subscribeToTopicList(subscribeTopicList);
  privateHivemqProvider.setSubscribtionCallBackFunction(handelSubscribtion);


  emqxProvider.subscribeToTopicList(subscribeTopicList);
  emqxProvider.setSubscribtionCallBackFunction(handelSubscribtion);

  hushiarProvider.subscribeToTopicList(subscribeTopicList);
  hushiarProvider.setSubscribtionCallBackFunction(handelSubscribtion);


  providerList.push(hivemqProvider);
  providerList.push(privateHivemqProvider);
  providerList.push(emqxProvider);
  providerList.push(hushiarProvider);

  this.setToken = setToken;
  this.setStatus = setStatus;
  this.setResolution = setResolution;
  this.publish = publish;
  this.setSubscribtionCallBackFunction = setSubscribtionCallBackFunction;
  this.setRegisterDeviceCallBackFunction = setRegisterDeviceCallBackFunction;
  this.setUploadImageCallBackFunction = setUploadImageCallBackFunction;
  this.setMovingCallBackFunction = setMovingCallBackFunction;
  this.subscribeDeviceTopic = subscribeDeviceTopic;
};
