var express = require('express');
var router = express.Router();
var util = require("util"); 
var length_calculator = require(__dirname + '/../helper_methods/length_calculator.js');
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
		if (req.file.size === 0) {
		    return next(new Error("Please select a file."));
		}
		fs.exists(req.file.path, function(exists) { 
			if(exists) { 
				var location = '/' + req.file.path;
				var filename = '/' + req.file.filename;
				var index = filename.lastIndexOf(".");
				var fileType = filename.substring(index + 1);
				console.log(fileType);
				if(req.body.mode === 'vector'){
					if(fileType !== "svg"){
						return next(new Error("Please select an svg file for vector cutting."));
					}
					else{
						var bundledData = SDP.parseData(location);
						res.render('vector_data', {
							title: 'Results',
							material: req.body.material,
							membership: req.body.membership,
							filename: filename,
							location: location,
							packagedData: bundledData
							// jogCoords: JSON.stringify(data.jogCoords)
						}); 
					}
				}
				else if(req.body.mode === 'raster'){
					if(fileType === "svg"){
						var data = length_calculator.getRasterCost(location, req.body.membership, req.body.resolution);
						res.render('raster_data_path', {
							title: 'Results',
							membership: req.body.membership,
							// naiveTime: data.time.toFixed(2),
							// naiveCost: data.money.toFixed(2),
							resolution: req.body.resolution,
							speed: MLV.laserSpeed.maxRasterSpeed,
							rate: MLV.cost[req.body.membership],
							filename: filename
						}); 
					}
					else if(fileType === "jpeg" || fileType === "JPG" || fileType === "jpg" || fileType === "png"){
        				res.render('raster_data_img', {
							title: 'Results',
							membership: req.body.membership,
							resolution: req.body.resolution,
							filename: filename,
							speed: MLV.laserSpeed.maxRasterSpeed,
							rate: MLV.cost[req.body.membership]
						}); 	
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