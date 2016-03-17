var express = require('express');
var router = express.Router();
var mocha = require('mocha');
var chai = require('chai');

/* GET about page. */
router.get('/', function(req, res, next) {
  res.render('raster_test', { title: 'Test Rastering' });
});

module.exports = router;
