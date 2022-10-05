const fetch = require('node-fetch');
const {InfluxDB} = require('@influxdata/influxdb-client');
const {Point} = require('@influxdata/influxdb-client');
const webpush = require('web-push');
var fs = require('fs');
var uuid = require('uuid');
var mqtt = require('mqtt');
var videoshow = require('videoshow');
var Jimp = require('jimp');
const redis = require('redis');
const cv = require('opencv4nodejs');
const fastFolderSize = require('fast-folder-size')

// You can generate a Token from the "Tokens Tab" in the UI
const token = '';
const org = '';
const bucket = "";

//const client = new InfluxDB({url: 'https://eu-central-1-1.aws.cloud2.influxdata.com', token: token});

//const writeApi = client.getWriteApi(org, bucket);
//writeApi.useDefaultTags({host: 'host1'});

const vapidKeys = {
  "publicKey":"",
  "privateKey":""
};

webpush.setVapidDetails(
    'mailto:example@yourdomain.org',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);


const KAVEHNEGAR_API_KEY = '';
var Kavenegar = require('kavenegar');
var kavenegarClient = Kavenegar.KavenegarApi({
    apikey: KAVEHNEGAR_API_KEY
});


var hivemqClient = mqtt.connect('mqtt://broker.hivemq.com');
var emqxClient = mqtt.connect('mqtt://broker.emqx.io');

var hushiarProviderOptions = {
    host: 'mqtt.hushiar.com',
    port: 1773,
    protocol: 'mqtt',
    username: '',
    password: ''
};

var hushiarClient = mqtt.connect(hushiarProviderOptions);

var hivemqPrivateProviderOptions = {
    host: 's1.eu.hivemq.cloud',
    port: 8883,
    protocol: 'mqtts',
    username: '',
    password: ''
};
var hivemqPrivateClient = mqtt.connect(hivemqPrivateProviderOptions);

const redisClient = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
});

redisClient.on('error', err => {
    console.log('Error ' + err);
});

var DB = require('../model/db');

const CAMERA_IMAGE_STORAGE_PATH = '/projects/homeSecurity/server/storage/images';
const CAMERA_VIDEO_STORAGE_PATH = '/projects/homeSecurity/server/storage/video';
const ARCHIVE_VIEDO_DURATION_MIN = 1;

const monitoringDurationSecond = 5;

var locationModel = require('../model/location.model.js');
var userModel = require('../model/user.model.js');
var deviceModel = require('../model/device.model.js');
var sensorModel = require('../model/sensor.model.js');
var actuatorModel = require('../model/actuator.model.js');
var logModel = require('../model/log.model.js');
var commandModel = require('../model/command.model.js');
var subscriberModel = require('../model/subscriber.model.js');
var deviceTypeModel = require('../model/deviceType.model.js');
var imageModel = require('../model/image.model.js');
var archiveModel = require('../model/archive.model.js');
var authModel = require('../model/auth.model.js');
var verboseModel = require('../model/verbose.model.js');


var influxProviderFile = require('../provider/influx.prvd.js');
var kavenegarProviderFile = require('../provider/kavenegar.prvd.js');
var hivemqProviderFile = require('../provider/hivemq.prvd.js');
var emqxProviderFile = require('../provider/emqx.prvd.js');
var hushiarProviderFile = require('../provider/hushiarMqtt.prvd.js');
var redisProviderFile = require('../provider/redis.prvd.js');

var influxProvider = new influxProviderFile({});
var kavenegarProvider = new kavenegarProviderFile({ kavenegarClient: kavenegarClient });
var hivemqProvider = new hivemqProviderFile( { mqttClient: hivemqClient } );
var privateHivemqProvider = new hivemqProviderFile( { mqttClient: hivemqPrivateClient } );
var emqxProvider = new emqxProviderFile( { mqttClient: emqxClient } );
var hushiarProvider = new hushiarProviderFile( { mqttClient: hushiarClient } );
var redisProvider = new redisProviderFile( { redisClient: redisClient });

var userManagerFile = require('./user.manager.js');
var locationManagerFile = require('./location.manager.js');
var deviceManagerFile = require('./device.manager.js');
var sensorManagerFile = require('./sensor.manager.js');
var actuatorManagerFile = require('./actuator.manager.js');
var logManagerFile = require('./log.manager.js');
var commandManagerFile = require('./command.manager.js');
var subscriberManagerFile = require('./subscriber.manager.js');
var deviceTypeManagerFile = require('./deviceType.manager.js');
var socketManagerFile = require('./socket.manager.js');
var apiBusManagerFile = require('./apiBus.manager.js');
var imageManagerFile = require('./image.manager.js');
var archiveManagerFile = require('./archive.manager.js');
var influxManagerFile = require('./influx.manager.js');
var authManagerFile = require('./auth.manager.js');
var notifyManagerFile = require('./notify.manager.js');
var verboseManagerFile = require('./verbose.manager.js');
var mqttManagerFile = require('./mqtt.manager.js');
var videoManagerFile = require('./video.manager.js');
var memStorageManagerFile = require('./memStorage.manager.js');
var motionDetectorManagerFile = require('./motionDetector.manager.js');
var storageManagerFile = require('./storage.manager.js');



var userManager = new userManagerFile({ userModel: userModel , webpush: webpush});
var locationManager = new locationManagerFile({ locationModel: locationModel });
var deviceManager = new deviceManagerFile({ deviceModel: deviceModel , uuid: uuid});
var sensorManager = new sensorManagerFile({ sensorModel: sensorModel , uuid: uuid});
var actuatorManager = new actuatorManagerFile({ actuatorModel: actuatorModel, uuid: uuid });
var logManager = new logManagerFile({ logModel: logModel, influxProvider: influxProvider});
var commandManager = new commandManagerFile({ commandModel: commandModel });
var subscriberManager = new subscriberManagerFile({ subscriberModel: subscriberModel});
var deviceTypeManager = new deviceTypeManagerFile({ deviceTypeModel: deviceTypeModel });
var socketManager = new socketManagerFile({});
var apiBusManager = new apiBusManagerFile({fetch: fetch });
var imageManager = new imageManagerFile({ imageModel: imageModel, fs: fs, uuid: uuid , imageStoragePath: CAMERA_IMAGE_STORAGE_PATH, jimp:Jimp});
var archiveManager = new archiveManagerFile({ archiveModel: archiveModel , videoStoragePath: CAMERA_VIDEO_STORAGE_PATH, fs: fs});
var influxManager = new influxManagerFile({ influxProvider: influxProvider, influxPoint: Point});
var authManager = new authManagerFile({ authModel: authModel});
var notifyManager= new notifyManagerFile({ kavenegarProvider: kavenegarProvider, setLastSMSDateTimeFunction: userManager.setLastSMSDateTime});
var verboseManager = new verboseManagerFile({ verboseModel: verboseModel });
var mqttManager = new mqttManagerFile( { hivemqProvider: hivemqProvider, privateHivemqProvider: privateHivemqProvider, emqxProvider: emqxProvider, hushiarProvider: hushiarProvider } );
var videoManager = new videoManagerFile( { videoshow: videoshow, uuid: uuid , videoStoragePath: CAMERA_VIDEO_STORAGE_PATH, fs: fs } );
var memStorageManager = new memStorageManagerFile( { redisProvider: redisProvider });
var motionDetectorManager = new motionDetectorManagerFile({ imageStoragePath: CAMERA_IMAGE_STORAGE_PATH , monitoringDurationSecond: monitoringDurationSecond, cv: cv });
var storageManager = new storageManagerFile({ fastFolderSize: fastFolderSize, fs: fs , imageStoragePath: CAMERA_IMAGE_STORAGE_PATH , videoStoragePath: CAMERA_VIDEO_STORAGE_PATH});



exports = module.exports = function() {
  this.manager = {
    user : userManager,
    location : locationManager,
    device: deviceManager,
    sensor: sensorManager,
    actuator: actuatorManager,
    log: logManager,
    command: commandManager,
    subscriber: subscriberManager,
    deviceType: deviceTypeManager,
    socket: socketManager,
    apiBus: apiBusManager,
    image: imageManager,
    archive : archiveManager,
    influx: influxManager,
    auth : authManager,
    notify : notifyManager,
    verbose: verboseManager,
    mqtt : mqttManager,
    video: videoManager,
    memStorage: memStorageManager,
    motionDetector: motionDetectorManager,
    storage: storageManager,
  };
  this.imageStoragePath = CAMERA_IMAGE_STORAGE_PATH;
  this.videoStoragePath = CAMERA_VIDEO_STORAGE_PATH;
  this.archiveVideoDurationMin = ARCHIVE_VIEDO_DURATION_MIN;
};
