/*Define dependencies.*/

var express = require('express');
var multer  = require('multer');
var app = express();
var done = false;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '-' + Date.now()+ '.svg')
    done = true;
  }
})

/*Configure the multer.*/

app.use(multer({storage: storage}).single('userImage'));

/*Handling routes.*/

app.get('/',function(req, res){
  res.sendfile("index.html");
});

app.post('/api/photo',function(req, res){
  if(done){
    console.log(req.files); //fix this
    res.end("File uploaded.");
  }
});

/*Run the server.*/
app.listen(3000,function(){
  console.log("Working on port 3000");
});