Livestream Directors
======

This is a small API built for Livestream which allows users with Livestream accounts to register as a film director. Directors can list their favorite camera, and favorite films as well as look up fellow directors.

Run the server with the following:

`npm start $PORT`

Required Node.JS Modules
------
1. Express
2. Mongoose
3. body-parser
4. https

API Endpoints
------
###/directors

This is the RESTful API endpoint for interacting with the director representation. This endpoint supports the following:

1. GET /directors
2. GET /directors/:id
3. POST /directors
4. PUT /directors/:id

Server Representation
------

The directors are stored in a MongoDB collection with the following attributes

1. livestream_id - Number, required, unique
2. full_name - String, required (pulled from livestream account info)
3. dob - Date, required (also pulled from account info)
4. favorite_camera - String
5. favorite_movies - Array

Testing
------

TODO