//import required libraries
var bezier = require('bezier-js');          //from https://github.com/Pomax/bezierjs
var fs = require('fs');                     
var parser = require('svg-path-parser');    //from https://github.com/hughsk/svg-path-parser

//initiate Stream to read from test file
var readableStream = fs.createReadStream('test.svg');
readableStream.setEncoding('utf8');

//Reads svg file, identifies path, and parses path
readableStream.on('data', function(chunk) {
    var start = chunk.indexOf("id=\"path") - 1;
    while(chunk.charAt(start) != '=' ){
        start--;
    }
    start += 2;
    var end = chunk.indexOf("\"", start);
    var pathString = chunk.substring(start,end);
    console.log(parser(pathString)); //implement method to take data from arrays and use functions to calculate length
});
 
readableStream.on('end', function() {
});

//Calculates length of line given array of x,y coordinates
function getLineLength(x_values, y_values){
    var length = 0;
    for(i = 1; i < x_values.length; i++){
        length += Math.sqrt(Math.pow((x_values[i]-x_values[i-1]), 2)+Math.pow((y_values[i]-y_values[i-1]), 2));
    }
    return length;
}

//Calculates length of cubic bezier curve given array of x,y coordinates
function getArcLength(x_current, y_current, x_values, y_values){
    var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1] , x_values[2],y_values[2])
    return curve.length();
}
