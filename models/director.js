var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var directorSchema = new Schema({
  livestream_id: {type: Number, required: true, unique: true},
  full_name: {type: String, required: true},
  dob: {type: Date,required: true},
  favorite_camera: String,
  favorite_movies: Array
});

var Director = mongoose.model('Director',directorSchema);

module.exports = Director;