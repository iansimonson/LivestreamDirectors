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


// Create the server
http.createServer(function(req,res){
  if(req.method === 'GET'){
    var connection = mysql.createConnection({
      user: username,
      password: pswd,
      database: 'director_registry'
    });

    connection.connect(function(err){
      if(err){
        console.error('error connecting: ' + err);
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('CONNECTION FAILED');
        return;
      }

      console.log('connected as id: ' + connection.threadId);
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('connection established');
    });
  }
}).listen(port);