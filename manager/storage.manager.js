var fs;
var fastFolderSize;
var imageStoragePath;
var videoStoragePath;


function getUserStorageUsedSize(userId){
  return new Promise(function(resolve, reject) {
    let userImageStoragePath = `${imageStoragePath}/${userId.toString()}`;
    let userVideoStoragePath = `${videoStoragePath}/${userId.toString()}`;
    if (fs.existsSync(userImageStoragePath)) {
      fastFolderSize(userImageStoragePath, (err, bytes) => {
        if (err) {
          throw err
        }
        let imageSizeInMB = Math.floor(bytes / 1024 / 1024);
        if (fs.existsSync(userImageStoragePath)) {
          fastFolderSize(userVideoStoragePath, (err, bytes) => {
            if (err) {
              throw err
            }
            let videoSizeInMB = Math.floor(bytes / 1024 / 1024);
            let totalSizeInMB = imageSizeInMB + videoSizeInMB;
            resolve(totalSizeInMB);

            })
        } else{
          createUserVideoFolder(userId)
            .then(function(createdUserVideoFolder){
              let totalSizeInMB = imageSizeInMB;
              resolve(totalSizeInMB);
            })
            .catch(function(err){
              reject(err);
            })
        }
      })
    } else{
      createUserImageFolder(userId)
        .then(function(createdUserImageFolder){
          createUserVideoFolder(userId)
            .then(function(createdUserVideoFolder){
              resolve(0);
            })
            .catch(function(err){
              reject(err);
            })
        })
        .catch(function(err){
          reject(err);
        })
    }
  });
}


function createUserImageFolder(userId){
  return new Promise(function(resolve, reject) {
    let userImageStoragePath = `${imageStoragePath}/${userId.toString()}`;
    fs.mkdir(userImageStoragePath, (err) => {
      if (err) {
        reject(err)
      }else{
        resolve(userImageStoragePath)
      }
    });
  });

}

function createUserVideoFolder(userId){
  return new Promise(function(resolve, reject) {
    let userVideoStoragePath = `${videoStoragePath}/${userId.toString()}`;
    fs.mkdir(userVideoStoragePath, (err) => {
      if (err) {
        reject(err)
      }else{
        resolve(userVideoStoragePath)
      }
    });
  });
}



exports = module.exports = function(options){
  fs = options.fs;
  fastFolderSize = options.fastFolderSize;
  imageStoragePath = options.imageStoragePath;
  videoStoragePath = options.videoStoragePath;

  this.getUserStorageUsedSize = getUserStorageUsedSize;
  this.createUserImageFolder = createUserImageFolder;
  this.createUserVideoFolder = createUserVideoFolder;
}
