var express = require('express');
var router = express.Router();
var util = require("util"); 
var svg_data_packager = require(__dirname + '/../helper_methods/svg_data_packager.js');
var materials_data = require(__dirname + '/../materials_data/materials_data.js')
var fs = require('fs');

/* GET calculator page page. */
router.get('/', function(req, res, next) {
  	res.render('calculator', { title: 'Laser Cutter Calculator' });
});

router.post("/upload", function(req, res, next){ 
	if (req.file) { 
		console.log(util.inspect(req.file));
		fs.exists(req.file.path, function(exists) { 
			if(exists) { 
				var location = '/' + req.file.path;
				var filename = '/' + req.file.filename;
				var index = filename.lastIndexOf(".");
				var fileType = filename.substring(index + 1);
				if(req.body.mode === 'vector'){
					if(fileType !== "svg"){
						return next(new Error("Please select an svg file for vector cutting.")); //fix filetype check
					}
					else{
						var bundledData = svg_data_packager.parseData(location);
						res.json({
							title: 'Results',
							material: req.body.material,
							membership: req.body.membership,
							filename: filename,
							location: location,
							packagedData: bundledData
						});
						res.end();
					}
				}
				else if(req.body.mode === 'raster'){
					if(fileType === "svg"){
						//add filetype check
						res.render('raster_data_path', {
							title: 'Results',
							membership: req.body.membership,
							resolution: req.body.resolution,
							filename: filename,
							speed: MLV.laserSpeed.maxRasterSpeed,
							rate: MLV.cost[req.body.membership]
						}); 
					}
					else if(fileType === "jpeg" || fileType === "JPG" || fileType === "jpg" || fileType === "png"){
						//add filetype check
						res.json({
							title: 'Results',
							membership: req.body.membership,
							resolution: req.body.resolution,
							filename: filename,
							speed: MLV.laserSpeed.maxRasterSpeed,
							rate: MLV.cost[req.body.membership]
						});
						res.end();
					}
				}
			}
			else { 
				res.end("Error. File not found."); 
			} 
		}); 
	}
});

module.exports = router;