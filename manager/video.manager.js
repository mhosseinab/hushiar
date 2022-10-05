var videoshow;
var uuid;
var videoStoragePath;
var fs;

function generateVideo(userId, deviceId, imagePahtList){

  let userFolderPath = `${videoStoragePath}/${userId}`
  let userDeviceFolderPath = `${videoStoragePath}/${userId}/${deviceId}`
  if (fs.existsSync(userFolderPath)) {
    if (fs.existsSync(userDeviceFolderPath)) {

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

  let fileName = `${uuid.v4()}.mp4`
  var finalVideoPath = `${videoStoragePath}/${userId}/${deviceId}/${fileName}`;


  // setup videoshow options
  var videoOptions = {
    fps: 2,
    loop: 1,
    transition: false,
    videoBitrate: 256,//512,
    videoCodec: 'libx264',
    size: '640x?',
    format: 'mp4',
    pixelFormat: 'yuv420p'
  }

  return videoshow(imagePahtList,videoOptions)
    .save(finalVideoPath)
    // .on('start', function (command) {
    //   console.log('ffmpeg process started:', command)
    // })
    // .on('error', function (err) {
    //   console.log(err);
    // })
    // .on('end', function () {
    //   console.log('done');
    //   resolve(fileName);
    // })

    //return videoshow;

}

function getVideoPathWithFileName(userId, deviceId, fileName){
  let path  = `${videoStoragePath}/${userId}/${deviceId}/${fileName}`;
  return path;
}

exports = module.exports = function(options){
  videoshow = options.videoshow;
  uuid = options.uuid;
  videoStoragePath = options.videoStoragePath;
  fs = options.fs;

  this.generateVideo = generateVideo;
  this.getVideoPathWithFileName = getVideoPathWithFileName;

}
