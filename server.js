// Import required modules

var http = require('http');
var https = require('https');
var mysql = require('mysql');
var md5 = require('MD5');


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
  POST /new {livestream_id} -> registers a new director using livestream_id
  POST /favcam {livestream_id, favorite_camera, [auth]} -> updates the favorite camera for the given livestream_id 
  POST /updatemovies {livestream_id, operation, movies:[list,of,films] Authorization} -> updates the favorite films list
************************/

function requestHandler(req,res){

// Process GET requests (only /directors has a GET request handler)
  if(req.method === 'GET'){
    if(req.url === '/directors'){
      console.log('new GET connection at /directors.');
      listDirectors(res);
    } else {
      routingError(res,req.url,req.method);
    }


// Process POST requests
  } else if (req.method === 'POST'){

    if(req.url === '/directors'){
      console.log('new POST connection at /directors.');
      newDirector(req,res);

    } else if(req.url ==='/updatecam'){
      console.log('new connection at /updatecam.');
      updateCamera(req,res);  
    } else if (req.url === '/updatemovies'){
      console.log('new connection at /updatemovies.');
      updateMovies(req,res);
    } else {
      routingError(res,req.url,req.method);
    }
  }
}


/**************
ERROR FUNCTIONS
  The following functions are for error handling that happens
  often. These error routines close the response streams from
  the http requests.
***************/

/*
FUNCTION: routingError
  called when there is an erroneous api request
  e.g. api endpoint doesn't exist or doesn't support
  request type
*/
function routingError(res,url,method){
  console.error('new connection attempted at ' + url + '.');
  res.writeHead(404,{'Content-Type':'text/plain'});
  res.end(url + ' either does not exist or does not support ' + method + ' requests.\n');
  return;
}


/*
FUNCTION: connectionError
  called when the database cannot be reached
*/
function connectionError(err,res){
  console.error('Error Connecting: ' + err);
  res.writeHead(520,{'Content-Type': 'text-plain'});
  res.end('Error: database connection failed.\n');
  return;
}

/*
FUNCTION: updateError
  called when an update request to the database
  could not be completed.
*/
function updateError(err,res){
  console.error('Error Updating: ' + err);
  res.writeHead(520,{'Content-Type': 'text/plain'});
  res.end('Error: updating database failed.\n');
  return;
}




/************
HELPER FUNCTIONS
  The following are the functions which
  actually perform the operations required
  by the API
*************/

/*
FUNCTION: listDirectors
  A helper function for the GET request to 
  /directors. This function returns all directors
  as a series of JSON strings separated by newlines
*/
function listDirectors(res){
  pool.getConnection(function(err,conn){
        if(err) return connectionError(err,res);

        console.log('connected as id: ' + conn.threadId);

        conn.query('SELECT * FROM directors',function(err,results,fields){
          if(err) return updateError(err,res);


          res.writeHead(200,{'Content-Type': 'application/JSON'});
          results.forEach(function(row){
            // console.log(JSON.stringify(row));
            res.write(JSON.stringify(row) + '\n');
          });
          conn.release();
          res.end();
        });

      });
}

/*
FUNCTION: newDirector
  called when the server receives a POST
  request to the /directors endpoint
  creates a new director if provided with
  a Livestream account number. Otherwise
  sends an error and closes the connection.
*/
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
          var post;
          try {
            post = JSON.parse(postbody);
            if(!post.hasOwnProperty('livestream_id'))
              throw 'Error: Missing livestream_id'; 
          } catch(err){
            console.error('Invalid POST content on /directors.');
            console.error(err);
            res.end('Invalid POST content.\n');
            conn.release();
            return;
          }
          
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
              var resJSON
              try{
                resJSON = JSON.parse(resbody);
                if(!resJSON.hasOwnProperty('full_name') || !resJSON.hasOwnProperty('dob'))
                  throw 'Error: Livestream JSON missing necessary parameters.';
              } catch(err){
                console.error('Invalid response from LIVESTREAM.');
                console.error(err);
                res.end('Received invalid response from LIVESTREAM.\n');
                conn.release();
                return;
              }

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

/*
FUNCTION: updateCamera
  called when the server receives a POST
  request to the /updatecamera endpoint.
  Checks for authorization using md5
  and if it matches the given account
  number, updates the favorite camera string
*/
function updateCamera(req,res){
  pool.getConnection(function(err,conn){
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
    req.on('end',function(){
      var post = JSON.parse(postbody);
      conn.query('SELECT * FROM directors WHERE livestream_id = ?',post.livestream_id,function(err,results){
        if(err) return updateError(err,res);


        // console.log('Authorization: ' + post.Authorization);
        // console.log('MySQL Authorization: ' + md5(result[0].full_name));
        if(post.Authorization !== 'Bearer ' + md5(results[0].full_name)){
          console.error('Error: Unauthorized attempt to update "favorite_camera".');
          res.writeHead(401,{'Content-Type':'text/plain'});
          res.end('Error: Authorization not recognized.\n');
          return;
        }

        // console.log(post.favorite_camera);
        conn.query('UPDATE directors SET favorite_camera=? WHERE livestream_id=?',[post.favorite_camera,results[0].livestream_id],function(err,result){
          if(err) return updateError(err,res);

          res.writeHead(200,{'Content-Type':'application/json'});
          res.end('Favorite Camera successfully updated\n');
          conn.release();
        });
      });
    });

  });
}



/*
FUNCTION: updateMovies
  called when the server receives a POST
  request to /updatemovies

  request must have:
    Authorization (md5)
    Livestream ID
    Operation (add/delete/replace)
    List of Movies as an Array
*/
function updateMovies(req,res){
  pool.getConnection(function(err,conn){
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

    req.on('end',function(){
      var post = JSON.parse(postbody);

      conn.query('SELECT * FROM directors WHERE livestream_id = ?',post.livestream_id,function(err,results){
        if(err) return updateError(err,res);

        if(post.Authorization !== 'Bearer ' + md5(results[0].full_name)){
          console.error('Error: Unauthorized attempt to update "favorite_films".');
          res.writeHead(401,{'Content-Type':'text/plain'});
          res.end('Error: Authorization not recognized.\n');
          return;
        }

        var director = results[0];
        var movies = (director.favorite_movies === null ? [] : director.favorite_movies.split(','));
        var newMovies = post.movies;

        // console.log(movies);
        // console.log(newMovies);
        // res.end();

        if(post.operation === 'add'){
          movies.push(newMovies);
        } else if(post.operation === 'delete'){
          newMovies.forEach(function(movie){
            var i = movies.indexOf(movie);
            if(i !== -1)
              movies.splice(i,1);
          });
        } else if(post.operation === 'replace'){
          movies = newMovies;
        } else {
          console.error('Error: operation ' + post.operation + ' is not valid.');
          res.writeHead(400,{'Content-Type':'text/plain'});
          res.end('Error: operation ' + post.operation + ' not permitted.\n');
          return;
        }

        conn.query('UPDATE directors SET favorite_movies=? WHERE livestream_id=?',[movies.toString(),post.livestream_id],function(err,result){
          if(err) return updateError(err,res);

          res.writeHead(200,{'Content-Type':'application/json'});
          res.end('Favorite Movies successfully updated\n');
          conn.release();
        });



      });
    });


  });
}