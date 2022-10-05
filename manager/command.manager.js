var Command;

function create(device, actuator, sensor, command){
  var newCommand = new Command({
    registerDate: new Date(),
    device: device,
    actuator: actuator,
    sensor: sensor,
    command: command,
    isDone: false,
  });

  return newCommand.save();
}

function create_device(device, command){
  return create(device, undefined, undefined, command);
}

function getAll_device_isDone(device, isDone){
  var query = {
    device: device,
    isDone: isDone
  };

  return Command
    .find(query)
    .populate('device sensor actuator')
    ;
}

function setExecutionResult(device, commandId, isDone){
  var query = {
    _id: commandId,
    device: device,
  };

  var update = {
    isDone: isDone,
  };

  return Command
    .findOneAndUpdate(query, update, {new: true});
}

exports = module.exports =  function(options){
  Command = options.commandModel;

  this.create_device = create_device;
  this.getAll_device_isDone = getAll_device_isDone;
  this.setExecutionResult = setExecutionResult;
};
