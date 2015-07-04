var bezier = require('bezier-js');
var fs = require('fs');
var data = '';
var parser = require('svg-path-parser');

var readableStream = fs.createReadStream('drawing.svg');
readableStream.setEncoding('utf8');

readableStream.on('data', function(chunk) {
    var start = chunk.indexOf("id=\"path") - 1;
    while(chunk.charAt(start) != '=' ){
        start--;
    }
    start += 2;
    var end = chunk.indexOf("\"", start);
    var temp = chunk.substring(start,end);
    console.log(parser(temp));
});
 
readableStream.on('end', function() {
     
});


function getLineLength(x_values, y_values){
    var length = 0;
    for(i = 1; i < x_values.length; i++){
        length += Math.sqrt(Math.pow((x_values[i]-x_values[i-1]), 2)+Math.pow((y_values[i]-y_values[i-1]), 2));
    }
    return length;
}

function getArcLength(x_current, y_current, x_values, y_values){
    var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1] , x_values[2],y_values[2])
    return curve.length();
}
