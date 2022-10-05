var DeviceType;

function create(){

}

function getAll(){
  return DeviceType.find({});
}

exports = module.exports = function(options){
  DeviceType = options.deviceTypeModel;

  this.create = create;
  this.getAll = getAll;
};
