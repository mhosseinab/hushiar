var Image;
var uuid;
var fs;
var jimp;
var CAMERA_IMAGE_STORAGE_PATH;

var lastImageMemoryStorage = [];

function setDeviceLastImage(imageData){
  lastImageMemoryStorage = lastImageMemoryStorage.filter(function(imageStorage){
    if(
      imageStorage.deviceId.toString() != imageData.deviceId.toString() &&
      imageStorage.actuatorId.toString() != imageData.actuatorId.toString()
    ){
      return imageStorage;
    }
  });

  lastImageMemoryStorage.push(imageData);
  console.log(`image in memory storage count >> ${lastImageMemoryStorage.length}`);
}

function getDiveceLastImage(deviceId, actuatorId){
  let foundImage = lastImageMemoryStorage.find(function(imageStorage){
    if(
      imageStorage.deviceId.toString() == deviceId.toString() &&
      imageStorage.actuatorId.toString() == actuatorId.toString()
    ){
      return imageStorage;
    }
  });
  return foundImage;
}

function create(fileName, file, device, actuator){
  let newImage = new Image({
    registerDate: new Date(),
    device: device,
    actuator: actuator,
    file: file,
    fileName: fileName
  });

  return newImage.save();
}

function get_device_actuator(device, actuator){
  var query = {
    device: device,
    actuator: actuator
  };

    let sortOptions = {
      registerDate: -1
    };

  return Image.findOne(query).sort(sortOptions).populate('device').populate('actuator');
}

function get_device_actuator_notImageId(device, actuator, notImageId){
  var query = {
    _id: { $ne: notImageId },
    device: device,
    actuator: actuator
  };

    let sortOptions = {
      registerDate: -1
    };

  return Image.findOne(query).sort(sortOptions).populate('device').populate('actuator');
}

function getAll_device_actuator_fromDateTime_toDateTime(device,fromDateTime, toDateTime){
  var query = {
    device: device,
    //actuator: actuator,
    registerDate: {
      $gte: fromDateTime,
      $lte: toDateTime
    }
  };

    let sortOptions = {
      registerDate: +1
    };

  return Image.find(query).sort(sortOptions).populate('device').populate('actuator');
}

function storeImage(userId, deviceId, imageBuffer){
  return new Promise(function(resolve, reject) {
    let file = {
        filename : `${uuid.v4()}.jpg`,
    };
    let path = getImagePathWithFileName(userId, deviceId, file.filename);
    fs.writeFile(path, imageBuffer, 'binary', function(err){
      if(err){
        let userFolderPath = `${CAMERA_IMAGE_STORAGE_PATH}/${userId}`
        let userDeviceFolderPath = `${CAMERA_IMAGE_STORAGE_PATH}/${userId}/${deviceId}`
        if (fs.existsSync(userFolderPath)) {
          if (fs.existsSync(userDeviceFolderPath)) {
              reject(err)
          } else {
            fs.mkdirSync(userDeviceFolderPath);
            console.log('create userDeviceFolderPath');
          }
        } else {
            fs.mkdirSync(userFolderPath);
            console.log('create userFolderPath');
            fs.mkdirSync(userDeviceFolderPath);
            console.log('create userDeviceFolderPath');
        }

        storeImage(userId, deviceId, imageBuffer)
      }else{
        //jimp.read(path, function(err, readedImage){
          //if(err){
            //console.log(err);
          //}else{
            //readedImage.rotate(90).write(path);
            //resolve(file);
          //}
        //})
        resolve(file);
      }
    });


  });
}

function getAll(){
  let query = {};
  let sortOptions = {
    registerDate:-1
  };
  return Image.find(query).sort(sortOptions);
}

function getAll_device(device){
  var query = {
    device: device
  };

    let sortOptions = {
      registerDate:-1
    };

  return Image.find(query).sort(sortOptions).populate('device').populate('actuator').limit(20);
}

function getAll_device_date(device, date){
  var query = {
    device: device
  };

    let sortOptions = {
      registerDate:-1
    };

  return Image
    .find(query)
    .sort(sortOptions)
    .populate('device')
    .populate('actuator')
    .limit(20);
}

function get_device_imageId(device, imageId){
  var query = {
    device: device,
    _id: imageId
  };

  return Image
    .findOne(query)
    .populate('device')
    .populate('actuator');
}

function getBase64FromPath(imageFilePath){
  return new Promise(function(resolve, reject) {
    fs.readFile(imageFilePath,{ encoding: 'base64' }, (err, imageContent) => {
      if (err) {
        reject(err);
      }
      resolve(imageContent);
    })
  });

}

function getImagePathWithFileName(userId, deviceId, fileName){
  let path  = `${CAMERA_IMAGE_STORAGE_PATH}/${userId}/${deviceId}/${fileName}`;
  return path;
}

function delete_device_imageId(userId, deviceId, imageId){
  var query = {
    _id: imageId,
    device: deviceId
  };

  return new Promise(function(resolve, reject) {
    // remove file from database
    Image.findByIdAndRemove(query, {rawResult:true})
      .then(function(deletedImage){
        // delete file from storage
        let path = getImagePathWithFileName(userId, deviceId, deletedImage.fileName);
        fs.rm(path,function(err){
          if(err){
            reject(err)
          }
        });
        resolve(deletedImage)
      })
      .catch(function(err){
        reject(err);
      })
  });


}

exports = module.exports = function(options){
    Image = options.imageModel;
    uuid = options.uuid;
    fs = options.fs;
    jimp = options.jimp;
    CAMERA_IMAGE_STORAGE_PATH = options.imageStoragePath;

    this.create = create;
    this.get_device_actuator = get_device_actuator;
    this.get_device_actuator_notImageId = get_device_actuator_notImageId;
    this.getAll_device_actuator_fromDateTime_toDateTime = getAll_device_actuator_fromDateTime_toDateTime;
    this.storeImage = storeImage;
    this.getAll = getAll;
    this.getAll_device = getAll_device;
    this.getAll_device_date = getAll_device_date;
    this.get_device_imageId = get_device_imageId;
    this.delete_device_imageId = delete_device_imageId;

    this.setDeviceLastImage = setDeviceLastImage;
    this.getDiveceLastImage = getDiveceLastImage;

    this.getBase64FromPath = getBase64FromPath;
    this.getImagePathWithFileName = getImagePathWithFileName;

};
