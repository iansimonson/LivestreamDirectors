var express = require('express');
var router = express.Router();
var Director = require('./models/director');


router.use(function timeLog(req,res,next){
  console.log('Time: ',Date.now());
  next();
});

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
  res.send('Create new director');
});


module.exports=router;

function getData(err,data){
  if(err) return console.error(err);
  return data;
}

function sendData(stream,data){
  console.log(data);
  stream.json(data);
}