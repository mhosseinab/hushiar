var Auth;

function create_user(user){
  return new Promise(function(resolve,reject){
    var newAuth = new Auth({
      authToken : Math.floor(Math.random()* (99999 - 10000 + 1) + 10000),
      createDate : new Date(),
      user:user,
    });

    newAuth.save(function(err,savedAuth){
      if(err){
        reject(err);
      }else{
        resolve(savedAuth);
      }
    });
  });
}


function get(id){
  let query = {
    _id: id
  };
  return Auth
    .findOne(query)
    .populate('user');
}

function get_user(user){
  return new Promise(function(resolve, reject) {
    let query = {user:user};
    Auth
      .findOne(query)
      .populate('user')
      .exec(function(err,foundAuth){
        if(err){
          reject(err);
        }
        resolve(foundAuth);
      });
  });
}

function get_user_authToken(user,authToken){
  let query = { user: user, authToken: authToken };
  return Auth.findOne(query);
}

function get_mobileNumber_authToken(mobileNumber, authToken) {
  let query = {
    mobileNumber:mobileNumber,
    authToken: authToken
  };
  return Auth.findOne(query);
}

function revokeToken(auth){
  return new Promise(function(resolve, reject) {
    auth.authToken = Math.floor(Math.random()* (99999 - 10000 + 1) + 10000);
    auth.createDate = new Date();

    auth.save(function(err,updatedAuth){
      if(err){
        reject(err);
      }
      resolve(updatedAuth);
    });
  });
}

exports = module.exports = function(options){
  Auth = options.authModel;

  this.create_user=create_user;
  this.get=get;
  this.get_user=get_user;
  this.get_user_authToken=get_user_authToken;
  this.get_mobileNumber_authToken = get_mobileNumber_authToken;
  this.revokeToken=revokeToken;
};
