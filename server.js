// Import required modules

var http = require('http');
var https = require('https');
var mysql = require('mysql');


/****************************
  Sets up the port the server will listen on
  as well as the username and password for
  the database to connect to
*****************************/

var port = process.argv[2];
var username = process.argv[3];
var pswd = process.argv[4];


//Create the MySQL POOL used to
//handle multiple connections and queries
var pool = mysql.createPool({
  user: username,
  password: pswd,
  database: 'director_registry'
});


// Create the server

http.createServer(requestHandler).listen(port);
console.log('Server running, listening on port: ' + port);







// ============================================================================= \\

// BELOW THIS LINE THERE ARE HELPER FUNCTIONS AND HANDLERS.

// ============================================================================= \\

/***********************
 FUNCTION: requestHandler(request, response)
 This function handles incoming requests to the http server
 Handled entry points:
  GET /directors -> lists all directors registered
  POST /new livestream_id -> registers a new director using livestream_id
  POST /favcam livestream_id favorite_camera [auth] -> updates the favorite camera for the given livestream_id 
  POST /updatefilms [auth] { type:add/remove/replace films:[list,of,films] } -> updates the favorite films list
************************/

function requestHandler(req,res){

// Process GET requests (only /directors has a GET request handler)
  if(req.method === 'GET'){
    if(req.url === '/directors'){
      console.log('new GET connection at /directors.');
      listDirectors(res);
    } else {
      console.error('new connection attempted at ' + req.url + '.');
      routingError(res,req.url,req.method);
    }


// Process POST requests
  } else if (req.method === 'POST'){

    if(req.url === '/directors'){
      console.log('new POST connection at /directors.');
      newDirector(req,res);

    } else if(req.url ==='/favcam'){
      console.log('new connection at /favcam.');
      res.end('connection POST on favcam.\n');
    } else if (req.url === '/updatefilms'){
      console.log('new connection at /updatefilms.');
      res.end('connection POST on updatefilms.\n');
    } else {
      console.error('new connection attempted at ' + req.url + '.');
      routingError(res,req.url,req.method);
    }
  }
}


function routingError(res,url,method){
  res.writeHead(404,{'Content-Type':'text/plain'});
  res.end(url + ' either does not exist or does not support ' + method + ' requests.\n');
}

function connectionError(err,res){
  console.error('Error Connecting: ' + err);
  res.writeHead(520,{'Content-Type': 'text-plain'});
  res.end('Error: database connection failed.\n');
  return;
}

function updateError(err,res){
  console.error('Error Updating: ' + err);
  res.writeHead(520,{'Content-Type': 'text/plain'});
  res.end('Error: updating database failed.\n');
  return;
}



function listDirectors(res){
  pool.getConnection(function(err,conn){
        if(err) return connectionError(err,res);

        console.log('connected as id: ' + conn.threadId);

        conn.query('SELECT * FROM directors',function(err,results,fields){
          if(err) return updateError(err,res);


          res.writeHead(200,{'Content-Type': 'application/JSON'});
          results.forEach(function(row){
            console.log(JSON.stringify(row));
            res.write(JSON.stringify(row) + '\n');
          });
          conn.release();
          res.end();
        });

      });
}


function newDirector(req,res){
  // Use the pool to generate a new database connection
  pool.getConnection(function(err,conn){
    // Error handling for the database connection
        if(err) return connectionError(err,res);
        console.log('connected as id: ' + conn.threadId);


        // Collect the POST values
        // POST values are in JSON string format
        var postbody = '';
        req.on('data',function(data){
          postbody += data;

          // Check to see if connection is trying to crash system
          // if so, destroy connection.
          if(postbody.length > 1e6){
            req.connection.destroy();
          }
        });

        // POST values collected, parse the JSON
        // collect the account info from Livestream
        // and create a new director
        req.on('end',function(){
          var post = JSON.parse(postbody);
          
          https.get('https://api.new.livestream.com/accounts/' + post.livestream_id,function(response){
            var resbody = '';

            response.on('data',function(data){
              resbody += data.toString();
              if(resbody.length > 1e6){
                req.connection.destroy();
              }
            });

            // Create the new account after parsing
            // the JSON retrieved from Livestream
            response.on('end',function(){
              var resJSON = JSON.parse(resbody);

              // JSON uses datetime string as: 'YYYY-MM-DDTHH:MM:SS[.frac]Z'
              // MySQL uses datetime string as: 'YYYY-MM-DD HH:MM:SS[.frac]'
              // so, replace the T and Z with a space and empty.
              var naccount = {'livestream_id': post.livestream_id,'full_name':resJSON.full_name,
                'dob':resJSON.dob.replace('T',' ').replace('Z','')};
              
              // Use ? for auto-escaping to protect against SQL injection
              conn.query('INSERT INTO directors SET ?',naccount,function(err,result){
                if(err) return updateError(err,res);

                res.writeHead(200,{'Content-Type':'application/json'});
                res.end(JSON.stringify(naccount)+'\n');
                conn.release();
              });
            });
            
          });
        });
      });
}