var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');

// var routes = require('./routes/index');
var about = require('./routes/about');
var calculator = require('./routes/calculator');
var raster_test = require('./routes/raster_test.js');
var vector_test = require('./routes/vector_test.js');

var location;

var app = express();

//configure multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    index = file.originalname.lastIndexOf(".");
    fileType = file.originalname.substring(index);
    location = file.originalname.substring(0, index) + '-' + Date.now() + fileType;
    cb(null, location)
    location = "/uploads/" + location;
  }
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: storage, fileSize: 50000000}).single('userImage'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'materials_data')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'test')));
app.use(express.static(path.join(__dirname, 'helper_methods')));

app.use('/', calculator);
app.use('/about', about);
app.use('/calculator', calculator);
app.use('/raster_test', raster_test);
app.use('/vector_test', vector_test);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
