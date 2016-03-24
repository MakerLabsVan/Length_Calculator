var fs = require('fs');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var LC = require(__dirname + '/length_calculator.js');
var math = require('mathjs');

var SDP = {
	parseData: function(file){
		var data = fs.readFileSync(__dirname + '/..' + file, 'utf8');
		var packagedData = [];
		while(data.indexOf('xmlns') !== -1){ //get rid of namespaces
	            var start = data.indexOf('xmlns');
	            var end = data.indexOf('\n', start);
	            data = data.substring(0, start) + data.substring(end+2);
	    }
	    var doc = new dom().parseFromString(data);      //parse String into data structure
	    var arrayOfStyles = xpath.select('//path[@style]', doc);    //find all path nodes with style attribute
	    var width = LC.toInches(xpath.select('/svg/@width', doc)[0].nodeValue);
	    var height = LC.toInches(xpath.select('/svg/@height', doc)[0].nodeValue);
	    var viewBox = {data: xpath.select('/svg/@viewBox', doc)[0]};
	    if(viewBox.data !== undefined){ //deal with viewbox
	        viewBox.data = viewBox.data.nodeValue;
	        viewBox.sy = viewBox.data.substring(viewBox.data.lastIndexOf(' ') + 1);
	        var tempString = viewBox.data.substring(0, viewBox.data.lastIndexOf(' '));
	        viewBox.sx = tempString.substring(tempString.lastIndexOf(' ') + 1);
	    }
	    for(var i = 0; i < arrayOfStyles.length; i++){
	    	var path = xpath.select('./@style', arrayOfStyles[i]);
	        var transform = xpath.select('ancestor::*/@transform', arrayOfStyles[i]); //group transformations
	        var transmat = math.matrix([[1,0,0],[0,1,0],[0,0,1]]);    //transformation matrix

	        for (var k = 0; k < transform.length; k++){     //take into account transformations
	            if(transform[k] !== undefined){
	                var temp = transform[k].nodeValue;
	                var scaleX = 1;
	                var scaleY = 1;
	                var translateX = 0;
	                var translateY = 0;
	                if (temp.indexOf('matrix') !== -1){
	                    scaleX = temp.substring(temp.indexOf('(')+1, temp.indexOf(','));
	                    var startingIndex = temp.indexOf(',', temp.indexOf(',', temp.indexOf(',') + 1) + 1) + 1;
	                    scaleY = temp.substring(startingIndex, temp.indexOf(',', startingIndex));
	                    translateX = parseFloat(temp.substring(temp.lastIndexOf(',', temp.lastIndexOf(',') - 1) + 1, temp.lastIndexOf(',')));
	                    translateY = parseFloat(temp.substring(temp.lastIndexOf(',') + 1, temp.indexOf(')')));
	                }
	                else if(temp.indexOf('scale') !== -1 && temp.indexOf(',') !== -1){
	                    scaleX = temp.substring(temp.indexOf('(')+1, temp.indexOf(','));
	                    scaleY = temp.substring(temp.indexOf(',')+1, temp.indexOf(')'));
	                }
	                else if(temp.indexOf('scale') !== -1){
	                    scaleX = temp.substring(temp.indexOf('(')+1, temp.indexOf(')'));
	                    scaleY = 1;
	                }
	                else if(temp.indexOf('translate') !== -1){
	                    translateX = parseFloat(temp.substring(temp.indexOf('(')+1, temp.indexOf(',')));
	                    translateY = parseFloat(temp.substring(temp.indexOf(',')+1, temp.indexOf(')')));
	                }
	                var tempmat = math.matrix([[scaleX, 0, translateX], [0, scaleY, translateY], [0, 0, 1]])
	                transmat = math.multiply(transmat, tempmat);
	            }
	        }

	        var individualTransform = xpath.select('./@transform', arrayOfStyles[i])[0]; //take into account individual path transform attributes. bugs with chaining transformations
	        if(individualTransform !== undefined){
	            var temp = individualTransform.nodeValue;
	            if (temp.indexOf('matrix') !== -1){
	                scaleX = temp.substring(temp.indexOf('(')+1, temp.indexOf(','));
	                var startingIndex = temp.indexOf(',', temp.indexOf(',', temp.indexOf(',') + 1) + 1) + 1;
	                scaleY = temp.substring(startingIndex, temp.indexOf(',', startingIndex));
	                translateX = parseFloat(temp.substring(temp.lastIndexOf(',', temp.lastIndexOf(',') - 1) + 1, temp.lastIndexOf(',')));
	                translateY = parseFloat(temp.substring(temp.lastIndexOf(',') + 1, temp.indexOf(')')));
	            }
	            else if(temp.indexOf('scale') !== -1 && temp.indexOf(',') !== -1){
	                scaleX = temp.substring(temp.indexOf('(')+1, temp.indexOf(','));
	                scaleY = temp.substring(temp.indexOf(',')+1, temp.indexOf(')'));
	            }
	            else if(temp.indexOf('scale') !== -1){
	                scaleX = temp.substring(temp.indexOf('(')+1, temp.indexOf(')'));
	                scaleY = 1;
	            }
	            else if(temp.indexOf('translate') !== -1){
	                translateX = parseFloat(temp.substring(temp.indexOf('(')+1, temp.indexOf(',')));
	                translateY = parseFloat(temp.substring(temp.indexOf(',')+1, temp.indexOf(')')));
	            }
	            var tempmat = math.matrix([[scaleX, 0, translateX], [0, scaleY, translateY], [0, 0, 1]]);
	            transmat = math.multiply(transmat, tempmat);
	        }
	        if (viewBox.data !== undefined){
	            var viewBoxScale = Math.min((width * 90) / viewBox.sx, (height * 90) / viewBox.sy);  //convert dimensions from inches to pixels, and scale coordinates to satisfy viewBox
	            var tempmat = math.matrix([[viewBoxScale, 0, 0], [0, viewBoxScale, 0], [0, 0, 1]])
	            transmat = math.multiply(transmat, tempmat);
	        }

	        var style_array = path[0].nodeValue.split(';');
	        var style = {};     //create object containing style attributes
	        for(var l = 0; l < style_array.length; l++){
	            style[style_array[l].substring(0,style_array[l].indexOf(":"))] = style_array[l].substring(style_array[l].indexOf(":")+1);
	        }
	        var colour = style.stroke;
	        var info = {dataString: xpath.select('./@d', arrayOfStyles[i])[0].nodeValue, transformMatrix: transmat}; //info needed for getLength function to calculate length of singular path
	        packagedData[i] = {getLengthInfo: info, styleData: style, colourOfPath: colour};
	    }
	    return packagedData;
	}
}

module.exports = SDP;