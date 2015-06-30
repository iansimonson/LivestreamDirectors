var https = require('https');

function getLivestreamAccount(livestream_id,callback){
  var responseBody = '';

  https.get('https://api.new.livestream.com/accounts/' + livestream_id,function(response){
    response.on('data',function(data){
      responseBody += data.toString();

      if(responseBody.length > 1e6){
        return callback(new Error());
      }
    });
    response.on('end',function(){
      var resJSON;
      resJSON = JSON.parse(responseBody);
      return callback(null,resJSON);
    });
  });
}

module.exports = getLivestreamAccount;