// Import required modules
var express = require('express');
var directors = require('./routes/directors');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');


/****************************
  Sets up the port the server will listen on
  as well as the username and password for
  the database to connect to
*****************************/

var port = process.argv[2];
var username = process.argv[3];
var pswd = process.argv[4];

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/directors',directors);


var db = mongoose.connection;
db.on('error',console.error);
mongoose.connect('mongodb://localhost/directors_registry');


// Create the server

var server = app.listen(port);
console.log('Server running, listening on port: ' + port);