//import required libraries
var bezier = require('bezier-js');          //from https://github.com/Pomax/bezierjs
var fs = require('fs');                     
var parser = require('svg-path-parser');    //from https://github.com/hughsk/svg-path-parser

//initiate Stream to read from test file. Assuming test file is located in project folder
var readableStream = fs.createReadStream('test.svg');
readableStream.setEncoding('utf8');

var length = 0.0;

//Reads svg file, identifies path, and parses path
readableStream.on('data', function(chunk) {
    var start = chunk.indexOf("\n     d=\"") + 9;
    var end = chunk.indexOf("\"", start);
    var pathString = chunk.substring(start,end);
    var arrayOfValues = parser(pathString);
    var currentX = 0.0;
    var currentY = 0.0;

    for (var i = 0; i < arrayOfValues.length; i++) {
        var temp = arrayOfValues[i];
        if(temp.command === "moveto"){
            if(temp.relative){
                currentX += temp.x;
                currentY += temp.y;
            }
            else{
                currentX = temp.x;
                currentY = temp.y;
            }
        }
        else if(temp.command === "lineto"){
            if(temp.relative){
                length += getLineLength([currentX, currentX + temp.x], [currentY, currentY + temp.y])
                currentX += temp.x;
                currentY += temp.y;
            }
            else{
                length += getLineLength([currentX, temp.x], [currentY, temp.y]);
                currentX = temp.x;
                currentY = temp.y;
            }
        }
        else if(temp.command === "curveto"){
            if(temp.relative){
                length += getArcLength(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]);
                currentX += temp.x;
                currentY += temp.y;
            }
            else{
                length += getArcLength(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]);
                currentX = temp.x;
                currentY = temp.y;
            }
        }
        else if(temp.command === "horizontal lineto"){
            if(temp.relative){
                length += getLineLength([currentX, currentX + temp.x], [currentY, currentY])
                currentX += temp.x;
            }
            else{
                length += getLineLength([currentX, temp.x], [currentY, currentY]);
                currentX = temp.x;
            }
        }
        else if(temp.command === "vertical lineto"){
            if(temp.relative){
                length += getLineLength([currentX, currentX], [currentY, currentY + temp.y])
                currentY += temp.y;
            }
            else{
                length += getLineLength([currentX, currentX], [currentY, currentY + temp.y]);
                currentY = temp.y;
            }
        }
    };

});
 
readableStream.on('end', function() {
    console.log(length);
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
