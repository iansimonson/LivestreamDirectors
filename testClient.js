var http = require('http');
var md5 = require('MD5');

/**
TEST 1, create user: steven spielberg
assumption: steven spielberg doesn't yet exist in the table
**/


var user = {
  livestream_id:6488834
};

var userString = JSON.stringify(user);

var headers = {
  'Content-Type': 'application/json',
  'Content-Length': userString.length
};

var options = {
  port: 8500,
  path: '/directors',
  method: 'POST',
  headers: headers
};

var req = http.request(options,function(res){
  res.setEncoding('utf8');

  var responseString = '';

  res.on('data',function(data){
    responseString += data;
  });

  res.on('error',function(err){
    console.error(err);
  });

  res.on('end', function(){
    var resultObj = JSON.parse(responseString);
    if(resultObj.livestream_id !== 6488834 && resultObj.full_name !== 'Steven Spielberg')
      console.error('TEST 1 FAILED: GOT ' + JSON.stringify(resultObj));
    else
      console.log('TEST 1 PASSED.');
  });
});

req.write(userString);
req.end();


/**
TEST 2: Update the favorite camera for steven spielberg
**/


user = {
  livestream_id:6488834,
  favorite_camera:'Canon XLR',
  Authorization: 'Bearer ' + md5('Steven Spielberg')
};

userString = JSON.stringify(user);

var headers = {
  'Content-Type': 'application/json',
  'Content-Length': userString.length
};

var options = {
  port: 8500,
  path: '/updatecam',
  method: 'POST',
  headers: headers
};


req = http.request(options,function(res){
  res.setEncoding('utf8');

  var responseString = '';

  res.on('data',function(data){
    responseString += data;
  });

  res.on('error',function(err){
    console.error(err);
  });

  res.on('end', function(){
    if(responseString !== 'Favorite Camera successfully updated\n')
      console.error('TEST 2 FAILED: GOT ' + responseString);
    else
      console.log('TEST 2 PASSED.');
  });
});

req.write(userString);
req.end();