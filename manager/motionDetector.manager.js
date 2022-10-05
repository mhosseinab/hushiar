var memoryImageList = [];
var monitoringDurationSecond;
var CAMERA_IMAGE_STORAGE_PATH;
var cv;
var minimumArea = 4000;
var onMoteionDetectedCallBackFunction;

function addNewImage(image){
  let deviceId = image.device._id;
  memoryImageList = getLatestImageList(memoryImageList);
  let imageObject  = createImageObject(image);
  memoryImageList.push(imageObject);
  let deviceImageList = getImageList_deviceId(memoryImageList,imageObject.deviceId);
  let compareResult = compareOneToList(deviceImageList, imageObject);
  if(compareResult.length > 0){
    onMoteionDetectedCallBackFunction(image.device, compareResult.fromImageObject,compareResult.toImageObject)
  }
}


function createImageObject(image){
    let imagePath = `${CAMERA_IMAGE_STORAGE_PATH}/${image.device.user._id}/${image.device._id}/${image.fileName}`;
    let fileMat = cv.imread(imagePath);
    let fileGray = fileMat.cvtColor(cv.COLOR_BGR2GRAY);
    let imageObject = {
        originalImage: image,
        path :  imagePath,
        mat : fileMat,
        gray: fileGray,
        deviceId: image.device._id,
        registerDate: image.registerDate,
    };

    return imageObject;
}

function getLatestImageList(imageObjectList){
  let result = imageObjectList.filter(function(imageObject){
    let now = new Date();
    let timDiff = now - imageObject.registerDate;
    if(timDiff < monitoringDurationSecond * 1000){
      return imageObject;
    }
  });

  return result;

}

function getImageList_deviceId(imageObjectList, deviceId){
  let result = imageObjectList.filter(function(imageObject){
    if(imageObject.deviceId.toString() == deviceId.toString()){
      return imageObject;
    }
  });

  return result;
}

function compareOneToList(imageObjectList, imageObject){
  let result = imageObjectList.filter(function(imageObjectItem){
    let contourList = getContourList(imageObjectItem, imageObject)
    let hasMovment = hasMovmentContourList(contourList, minimumArea);
    if( hasMovment == true){
        return {
          fromImageObject: imageObjectItem,
          toImageObject: imageObject,
        }
    }
  });
  return result;
}

function hasMovmentContourList(contourList, minimumArea){
    let hasMovment = false;
    for (let countorItem of contourList) {
        if(countorItem.area > minimumArea){
            console.log(countorItem.area);
            hasMovment = true;
            break;
        }
    }
    return hasMovment;
}

function getContourList(imageObject1, imageObject2){
    try {
        const frameDifference = imageObject1.gray.absdiff(imageObject2.gray);
        let thresh = frameDifference.threshold(25, 255, cv.THRESH_BINARY);
        thresh = thresh.dilate(cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),new cv.Point(-1, -1), 2)
        const cnts = thresh.copy().findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        return cnts;
    } catch (error) {
        console.log(error);
    }

}

function setOnMoteionDetectedCallBackFunction(callBackFunction){
  onMoteionDetectedCallBackFunction = callBackFunction;
}

exports = module.exports = function(options){
  CAMERA_IMAGE_STORAGE_PATH = options.imageStoragePath;
  monitoringDurationSecond = options.monitoringDurationSecond;
  cv = options.cv;

  this.addNewImage = addNewImage;
  this.setOnMoteionDetectedCallBackFunction = setOnMoteionDetectedCallBackFunction;

}
