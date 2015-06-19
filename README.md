Livestream Directors
======

This is a small API built for Livestream which allows users with Livestream accounts to register as a film director. Directors can list their favorite camera, and favorite films as well as look up fellow directors.

API Endpoints
------

Server Representation
------

The directors are stored in a mySQL table with the following columns

1. livestream_id - integer, and primary key (pulled from livestream account info)
2. full_name - varchar(255), (also pulled from livestream account info)
3. dob - datetime, the date of birth (also pulled from account info)
4. favorite_camera - varchar(255), the director's favorite camera as a string
5. favorite_films - text, a JSON string listing the director's favorite film.