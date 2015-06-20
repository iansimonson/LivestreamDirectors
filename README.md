Livestream Directors
======

This is a small API built for Livestream which allows users with Livestream accounts to register as a film director. Directors can list their favorite camera, and favorite films as well as look up fellow directors.

Run the server with the following:

`node server.js port database_user database_password`

Required Node.JS Modules
------
1. http
2. https
3. mysql
4. MD5

API Endpoints
------
###/directors

This endpoint allows for GET and POST requests. GET requests are handled by returning the list of directors registered on the service. They are returned as a series of JSON strings separated by newlines. For POST requests, the caller must supply a Livestream user ID. This id is used to call Livestream's servers and create a new director account. This request responds with the JSON string for the newly created director or an error message if the director account already exists.

###/updatecam

This endpoint takes POST requests only. The caller must provide the following as JSON:

1. Livestream_id
2. favorite_camera (a string)
3. Authorization (formatted: 'Bearer: md5(full_name)')

This endpoint overwrites the current favorite camera of a given director.

###/updatemovies

This endpoint takes POST requests only. The caller must provide the following as JSON:

1. Livestream_id
2. Authorization (formatted: 'Bearer: md5(full_name)')
3. operation (add/delete/replace)
4. movies (as an array e.g. movies:['jurrasic park','up'])

The endpoint updates the list of favorite movies depending on the operation provided. If the operation is add, the api pushes the list of movies provided onto the current list of movies. If the operation is delete, the api removes the designated movies (if they are in the list) from the current list of favorite movies. Lastly, if the operation is replace, the current list of favorite movies is replaced with the provided list.

Server Representation
------

The directors are stored in a mySQL table with the following columns

1. livestream_id - integer, and primary key (pulled from livestream account info)
2. full_name - varchar(255), (also pulled from livestream account info)
3. dob - datetime, the date of birth (also pulled from account info)
4. favorite_camera - varchar(255), the director's favorite camera as a string
5. favorite_movies - text, a JSON string listing the director's favorite movie.

Testing
------

Testing of the API was done using cURL on the command line.

For the GET (listing directors) interface the following were used:

1. curl localhost:8500/directors (this should work correctly)
2. curl localhost:8500/updatemovies (or any other path, should return 'invalid')

For the POST interfaces the following was used:

1. curl -H "Content-Type: application/json" -X POST -d '{"livestream_id":6488824,"Authorization":"Bearer 0c1f04161f135b59960cc73854c46177","movies":["south park","kung fury"],"operation":"replace"}' http://localhost:8500/updatemovies

The POST data (that within the -d 'data') was altered to throw non JSON or syntax errored versions at the server.

Error messages are both logged by the server on the console and a similar (but client related) message was sent to the client.
