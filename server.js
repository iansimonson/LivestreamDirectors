// Import required modules

var http = require('http');
var url = require('url');
var mysql = require('mysql');

/****************************
  Sets up the port the server will listen on
  as well as the username and password for
  the database to connect to
*****************************/

var port = process.argv[2];
var username = process.argv[3];
var pswd = process.argv[4];

var pool = mysql.createPool({
  user: username,
  password: pswd,
  database: 'director_registry'
});

// Create the server
http.createServer(requestHandler).listen(port);
console.log('Server running, listening on port: ' + port);



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
  var reqObj = url.parse(req.url,true);

  if(req.method === 'GET'){
    if(req.url === '/directors'){
      pool.getConnection(function(err,conn){
        if(err){
          console.error('error connecting: ' + err);
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.end('CONNECTION FAILED');
          return;
        }

        console.log('connected as id: ' + conn.threadId);

        conn.query('SELECT * FROM directors',function(err,results,fields){
          if(err) return console.error(err);

          res.writeHead(200,{'Content-Type': 'application/JSON'});
          results.forEach(function(row){
            console.log(JSON.stringify(row));
            res.write(JSON.stringify(row) + '\n');
          });
          conn.release();
          res.end();
        });

      });
    } else {
      res.writeHead(404,{'Content-Type': 'text/plain'});
      res.end('Can only GET on /directors');
    }
  } else if (req.method === 'POST'){
    
  }
}