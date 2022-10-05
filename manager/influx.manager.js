var influxProvider;
var Point;

function write(){
  var point = new Point('mem').floatField('used_percent', 23.43234543);
  return influxProvider.write(point);
}

function ingestMoving(deviceId,isMoving){
  
}

exports = module.exports = function(options){
  influxProvider = options.influxProvider;
  Point = options.influxPoint;

  this.write = write;
};
