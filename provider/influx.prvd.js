

const {InfluxDB} = require('@influxdata/influxdb-client')

// You can generate a Token from the "Tokens Tab" in the UI
const token = ''
const org = ''
const bucket = ""

const client = new InfluxDB({
  url: 'https://eu-central-1-1.aws.cloud2.influxdata.com',
  token: token
})
var {Point} = require('@influxdata/influxdb-client');


function write(point){
  return new Promise(function(resolve, reject) {
      var writeApi = client.getWriteApi(org, bucket);
      writeApi.writePoint(point);

      writeApi
          .close()
          .then(() => {
              resolve('done')
          })
          .catch(err => {
              console.log(err)
              reject(err);
          })



  });
}

function writeBoolean(measurement, deviceId, field, value){
  const point = new Point(measurement).tag('deviceId', deviceId).stringField(field, value);
  return write(point);
}

function writeString(measurement, deviceId, field, value){
  const point = new Point(measurement).tag('deviceId', deviceId).stringField(field, value);
  return write(point);
}

exports = module.exports = function(options){

  this.write = write;
  this.writeBoolean = writeBoolean;
  this.writeString = writeString;

};
