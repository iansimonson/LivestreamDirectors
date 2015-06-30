// Import required modules

var https = require('https');
var express = require('express');
var directors = require('./directors');
var path = require('path');
var mongoose = require('mongoose');

/****************************
  Sets up the port the server will listen on
  as well as the username and password for
  the database to connect to
*****************************/

var port = process.argv[2];
var username = process.argv[3];
var pswd = process.argv[4];

var app = express();

app.use('/directors',directors);


var db = mongoose.connection;
db.on('error',console.error);
mongoose.connect('mongodb://localhost/directors_registry');


// Create the server

var server = app.listen(port);
console.log('Server running, listening on port: ' + port);







// ============================================================================= \\

// BELOW THIS LINE THERE ARE HELPER FUNCTIONS AND HANDLERS.

// ============================================================================= \\


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