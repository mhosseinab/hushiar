var Location;

function getAll_user(user){
  var query = {
    user: user
  };
  return Location.find(query);
}

function add(user, title) {
  var newLocation = new Location({
    user: user,
    title: title
  });

  return newLocation.save();
}

exports = module.exports = function(options){
  Location = options.locationModel;

  this.getAll_user = getAll_user;
  this.add = add;
};
