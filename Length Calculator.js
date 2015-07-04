	var bezier = require('bezier-js');
	var fs = require('fs');
	var readableStream = fs.createReadStream('/Users/Jeremy/Desktop/drawing.svg');
	readableStream.setEncoding('utf8');

    function getLineLength(x_values, y_values){
        var length = 0;
        for(i = 1; i < x_values.length; i++){
            length += Math.sqrt(Math.pow((x_values[i]-x_values[i-1]), 2)+Math.pow((y_values[i]-y_values[i-1]), 2));
        }
        return length;
    }

    var curve = new bezier(100,200 , 300,400 , 400,500 , 600,500);
    console.log(curve.length());