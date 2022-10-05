
function getByUser(socketList, userId){
  var result = socketList.find(function(socket){
    if(socket.user._id.toString() == userId.toString()){
      return socket;
    }
  });

  return result;
}

function newConnection(socketList, socket){
  var existingSocket = getByUser(socketList, socket.user._id);

  if(existingSocket){
    var newList = socketList.filter(function(socket){
      if(socket.user._id.toString() != existingSocket.user._id.toString()){
        return socket;
      }
    });
    newList.push(socket);
    return newList;
  }else{
    socketList.push(socket);
    return  socketList;
  }

}

function removeConnection(socketList, socket){
  var newList = socketList.filter(function(currentSocket){
    if(socket.user._id.toString() != currentSocket.user._id.toString()){
      return currentSocket;
    }
  });
  console.log('removeConnection');
  return newList;
}

exports = module.exports = function(options){
  this.getByUser = getByUser;
  this.newConnection = newConnection;
  this.removeConnection = removeConnection;
};
