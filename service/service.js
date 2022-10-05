var schedule = require('node-schedule');
const fastFolderSize = require('fast-folder-size')
const fs = require('fs')

var iocFile = require('../manager/ioc.manager.js');
var ioc = new iocFile();

console.log('============ Home Security Service Started ===================');

var archiveSchedulerRule = `*/${ioc.archiveVideoDurationMin} * * * *`;

var remaningDaysScheduleRule = new schedule.RecurrenceRule();
remaningDaysScheduleRule.hour = 10;
remaningDaysScheduleRule.minute = 50;

var storageMonitoringSchedulerRule = `*/${ioc.archiveVideoDurationMin} * * * *`;


var archiveScheduler = schedule.scheduleJob(archiveSchedulerRule, function() {
    archiveImages();
});

var remaningDaysScheduler = schedule.scheduleJob(remaningDaysScheduleRule,function(){
	updateUserListRemaningDays();
});

var storageMonitoringScheduler = schedule.scheduleJob(storageMonitoringSchedulerRule, function() {
  updateUserListStorageInfo();
});


function archiveImages(){
  console.log('archiving ... ');
  ioc.manager.device.getAll()
    .then(function(foundDeviceList){

      let toDateTime = new Date();
      let fromDateTime = new Date(toDateTime.getTime() - ioc.archiveVideoDurationMin * 60 * 1000);
      foundDeviceList.forEach(function(device){
        archiveDeviceImages(device,fromDateTime, toDateTime)
        return device._id;
      });
    })
    .catch(function(err){
      console.log(err);
    })
}

function archiveDeviceImages(device, fromDateTime, toDateTime){
  ioc.manager.image.getAll_device_actuator_fromDateTime_toDateTime(device,fromDateTime, toDateTime)
    .then(function(foundImageList){
      if(foundImageList.length > 0){
          let userId = device.user._id.toString();
          let deviceId = device._id.toString();
          console.log(`start archiving ${device.title} -> ${device._id}`);
          var archiveImageListPath = foundImageList.map(function(image){
            let imageFilePath = ioc.manager.image.getImagePathWithFileName(userId, deviceId, image.fileName);
            return imageFilePath;
          });

          let firstImageDateTime = foundImageList[0].registerDate;
          let lastImageDateTime = foundImageList[foundImageList.length - 1].registerDate;

          console.log(`firstImageDateTime: ${firstImageDateTime}`);
          console.log(`lastImageDateTime: ${lastImageDateTime}`);

          ioc.manager.video.generateVideo(userId, deviceId, archiveImageListPath)
          .on('start', function (command) {
            //console.log('ffmpeg process started:', command)
            console.log('ffmpeg process started');
          })
          .on('error', function (err) {
            console.log(err);
          })
          .on('end', function (output) {
            console.log('done');
            console.log(output);
            let outputParts = output.split("/");
            let fileName = outputParts[outputParts.length - 1];


            ioc.manager.archive.completedWithService(device, firstImageDateTime, lastImageDateTime, fileName, foundImageList)
              .then(function(archiveVideoArchive){
                  ioc.manager.log.videoArchived(device,archiveVideoArchive._id)
                    .then(function(createdLog){
                      console.log('Video File Archived');
                      ioc.manager.apiBus.notifyNewLogUserOnSocket(device.user._id, device._id, createdLog);
                    })
                    .catch(function(err){
                      console.log(err);
                    })

                })
              .catch(function(err){
                  console.log(err);
                })
          })
      }else{
        console.log(`No Image Found for ${device.title}->${device._id}`);
      }
    })
    .catch(function(err){
      console.log(err);
    })
}


function updateUserListRemaningDays(){
  ioc.manager.user.getAll()
    .then(function(userList){
      promiseList = userList.map(function(user){
        return ioc.manager.user.updateRemainingDays(user._id, -1)
      });
      Promise.all(promiseList).then((updatedValues) => {
        console.log(updatedValues);
      });
    })
    .catch(function(err){
      console.log(err);
    })
};

function updateUserListStorageInfo(){
  ioc.manager.user.getAll()
    .then(function(userList){
      userList.forEach((user, i) => {
        ioc.manager.storage.getUserStorageUsedSize(user._id)
          .then(function(userTotalUsedSize){
            if(user.storageUsedSize != userTotalUsedSize){
              if(!user.storageMaxSize){
                let userDefaultStorageMaxSize = 200;
                ioc.manager.user.setStorageMaxSize(user._id,userDefaultStorageMaxSize)
                  .then(function(updatedUser){
                    console.log(`Set userDefaultStorageMaxSize for User ${updatedUser._id}`);
                  })
                  .catch(function(err){
                    console.log(err);
                  })
              }else{
                let storageRemainedSize = user.storageMaxSize - userTotalUsedSize;
                ioc.manager.user.setStorageUsage(user._id, userTotalUsedSize, storageRemainedSize)
                  .then(function(updatedUser){
                      console.log(`${updatedUser._id}-> maxSize:${updatedUser.storageMaxSize}| storageUsedSize:${updatedUser.storageUsedSize}| remainedSize:${updatedUser.storageRemainedSize}`);
                  })
                  .catch(function(err){
                    console.log(err);
                  })
              }
            }
          })
          .catch(function(err){
            console.log(err);
          })

      });

    })
    .catch(function(err){
      console.log(err);
    })
}
