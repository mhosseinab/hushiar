
var Verbose;

function ingest(device, data){
  var newVerbose = new Verbose({
    registerDate: new Date(),
    device: device,
    data: data,
  });

  return newVerbose.save();
}


exports = module.exports = function(options){
  Verbose = options.verboseModel;

  this.ingest = ingest;
};
