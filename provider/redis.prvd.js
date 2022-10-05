var redisClient;

function set(key, value){
  return new Promise(function(resolve, reject) {
    redisClient.set(key, value, (err, reply) => {
      if (err){
        reject(err);
      }else{
        resolve(reply);
      }
    });
  });
}

function get(key){
  return new Promise(function(resolve, reject) {
    redisClient.get(key, (err, reply) => {
        if (err){
          reject(err);
        }else{
          resolve(reply);
        }
    });
  });
}

exports = module.exports = function(options){
  redisClient = options.redisClient;

  this.set = set;
  this.get = get;
}
