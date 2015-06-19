// Import required modules

var http = require('http');
var https = require('https');
var url = require('url');
var mysql = require('mysql');
var qs = require('querystring');



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
  var reqObj = url.parse(req.url,true);

// Process GET requests (only /directors has a GET request handler)
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


// Process POST requests
  } else if (req.method === 'POST'){

    if(req.url === '/directors'){

      pool.getConnection(function(err,conn){
        if(err){
          console.error('error connecting: ' + err);
          res.writeHead(404,{'Content-Type': 'text/plain'});
          res.end('Connection failed.\n');
          return;
        }

        console.log('connected as id: ' + conn.threadId);

        var postbody = '';
        req.on('data',function(data){
          postbody += data;

          if(postbody.length > 1e6){
            req.connection.destroy();
          }
        });

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

            response.on('end',function(){
              var resJSON = JSON.parse(resbody);
              var naccount = {'livestream_id': post.livestream_id,'full_name':resJSON.full_name,'dob':resJSON.dob.replace('T',' ').replace('Z','')};
              conn.query('INSERT INTO directors SET ?',naccount,function(err,result){
                if(err) {
                  console.error(err);
                  return res.end('Error: ' + err.message);
                }

                res.writeHead(200,{'Content-Type':'text/plain'});
                res.end(JSON.stringify(naccount)+'\n');
                conn.release();
              });
            });
            
          });
        });
      });


    } else if(req.url ==='/favcam'){
      res.end('connection POST on favcam'+'\n');
    } else if (req.url === '/updatefilms'){
      res.end('connection POST on updatefilms'+'\n');
    } else {
      res.writeHead(404,{'Content-Type': 'text/plain'});
      res.end(req.url + ' is not an API endpoint');
    }
  }
}