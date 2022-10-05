var Archive;
var videoStoragePath;
var fs;
function startMoving(device, sensor){
  var newArchive = new Archive({
    device:device,
    sensor: sensor,
    startDate: new Date(),
    isMoving: true,
  });
  setEndOfAll(device, sensor);
  return newArchive.save();
}

function setEndOfAll(device, sensor){
  var query = {
    device: device,
    sensor: sensor,
    endDate: undefined,
    isMoving: true,
  };

  var update = {
    endDate: new Date(),

  };

  return Archive
    .updateMany(query, update, {new: true});
}

function endMoving(device, sensor){
  var query = {
    device: device,
    sensor: sensor,
    endDate: undefined,
    isMoving: true,
  };

  var update = {
    endDate: new Date(),
  };

  return Archive
    .findOneAndUpdate(query, update, {new: true});
}

function get(archiveId){
  var query = {
    _id: archiveId,
  };

  console.log(query);

  return Archive
    .findOne(query)
    .populate('sensor')
    .populate('device')
    .populate('imageList')
}

function getAll_device(device){
  var query = {
    device:device,
  };

  return Archive
    .find(query)
    .sort({'startDate': -1})
    .populate('sensor')
    .populate('device')
    .populate('imageList')
    .limit(20);
}


function getAllVideo_device(device){
  var query = {
    device:device,
    videoFileName: { $ne: null }
  };

  return Archive
    .find(query)
    .sort({'startDate': -1})
    .populate('sensor')
    .populate('device')
    .populate('imageList')
    .limit(50);
}

function getAll_deviceList(deviceList){
  var query = {
    device:{
      $in: deviceList
    },
  };

  return Archive
    .find(query)
    .sort({'registerDate': -1})
    .populate('sensor')
    .limit(20);
}

function setVideoFileName(archiveId, videoFileName){
  var query = {
    _id: archiveId,
  };

  var update = {
    videoFileName: videoFileName,
  };

  return Archive
    .findOneAndUpdate(query, update, {new: true});
}

function completedWithService(device, startDate, endDate, videoFileName, imageList){
  var newArchive = new Archive({
    device:device,
    startDate: startDate,
    endDate: endDate,
    isMoving: false,
    videoFileName: videoFileName,
    imageList: imageList,
  });
  return newArchive.save();
}

function delete_device_archiveId(userId, deviceId, archiveId){
  var query = {
    _id: archiveId,
    device: deviceId
  };

  return new Promise(function(resolve, reject) {
    // remove file from database
    Archive.findByIdAndRemove(query, {rawResult:true})
      .then(function(deletedArchive){
        // delete file from storage
        let path = getVideoPathWithFileName(userId, deviceId, deletedArchive.videoFileName);
        fs.rm(path,function(err){
          if(err){
            reject(err)
          }
        });
        resolve(deletedArchive)
      })
      .catch(function(err){
        reject(err);
      })
  });
}

function getVideoPathWithFileName(userId, deviceId, fileName){
  let path  = `${videoStoragePath}/${userId}/${deviceId}/${fileName}`;
  return path;
}

function removeByDevice(deviceId){
  var query = {
    device: deviceId
  };

  return Archive.deleteMany(query, {rawResult:true});
}

exports = module.exports = function(options){
  Archive = options.archiveModel;
  videoStoragePath = options.videoStoragePath;
  fs = options.fs;

  this.startMoving = startMoving;
  this.endMoving = endMoving;
  this.get = get;
  this.getAll_deviceList = getAll_deviceList;
  this.getAllVideo_device = getAllVideo_device;
  this.getAll_device = getAll_device;
  this.setVideoFileName = setVideoFileName;
  this.completedWithService = completedWithService;
  this.delete_device_archiveId = delete_device_archiveId;
  this.removeByDevice = removeByDevice;

};
