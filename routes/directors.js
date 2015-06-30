var express = require('express');
var Director = require('../models/director');
var livestream = require('../livestream-connect.js');


var router = express.Router();


router.get('/',function(req,res){
  var directors = Director.find({},{'_id': false},function(err,directors){
    if(err) return console.error(err);
    
    console.log(directors);
    res.json(directors);
  });
});

router.get('/:id',function(req,res){
  Director.findOne({livestream_id:req.params.id},{'_id': false},function(err,director){
    if(err) return console.error(err);
    
    console.log(director);
    res.json(director);
  });
});

router.post('/',function(req,res){
  if(!req.body.hasOwnProperty('livestream_id')){
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  livestream(req.body.livestream_id,function(err,livestreamAcc){
    if(err) return console.error(err);

    var newDirector = new Director({
      livestream_id:livestreamAcc.id,
      full_name:livestreamAcc.full_name,
      dob:livestreamAcc.dob
    });

    newDirector.save(function(err,director){
      if(err) return console.error(err);
      console.log(director);
      res.json(newDirector);
    });
  });
});


router.put('/:id',function(req,res){
  var fav_cam = false;
  var fav_mov = false;

  if(req.body.hasOwnProperty('favorite_camera')){
    fav_cam = true;
  }
  if(req.body.hasOwnProperty('favorite_movies')){
    fav_mov = true;
  }

  Director.findOne({livestream_id:req.params.id},function(err,director){
    if(err) return console.error(err);
    
    if(fav_cam){
      director.favorite_camera = req.body.favorite_camera;
    }
    if(fav_mov){
      director.favorite_movies = req.body.favorite_movies;
    }

    director.save(function(err,dir){
      if(err) return console.error(err);
      res.send(dir);
    });
  });
});


module.exports=router;