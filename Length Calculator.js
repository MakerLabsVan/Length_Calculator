//import required libraries
var bezier = require('bezier-js');          //from https://github.com/Pomax/bezierjs
var fs = require('fs');                     
var parser = require('svg-path-parser');    //from https://github.com/hughsk/svg-path-parser

//initiate Stream to read from test file. Assuming test file is located in project folder
var readableStream = fs.createReadStream('test2.svg', { highWaterMark: 100000 });
readableStream.setEncoding('utf8');
var length = 0.0;

//Reads svg file, identifies path, and parses path
readableStream.on('data', function(chunk) {
    var totalLines = (chunk.match(/<path/g) || "").length;
    var indexOfLastLine = 0;
    while(totalLines != 0){
        var start = chunk.indexOf(" d=\"", indexOfLastLine) + 4;
        var end = chunk.indexOf("\"", start);
        var pathString = chunk.substring(start,end);
        var arrayOfValues = parser(pathString);
        var currentX = 0.0;
        var currentY = 0.0;
        var closeX = 0.0; //for closing path calculations
        var closeY = 0.0;
        var smoothX = 0.0; //for shorthand curve calculations
        var smoothY = 0.0;

        for (var i = 0; i < arrayOfValues.length; i++) {
            var temp = arrayOfValues[i];
            if(temp.command === "moveto"){
                if(temp.relative){
                    currentX += temp.x;
                    currentY += temp.y;
                    closeX += temp.x;
                    closeY += temp.y;
                }
                else{
                    currentX = temp.x;
                    currentY = temp.y;
                    closeX = temp.x;
                    closeY = temp.y;
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
                    length += getLineLength([currentX, currentX], [currentY, temp.y]);
                    currentY = temp.y;
                }
            }
            else if(temp.command === "closepath"){
                length += getLineLength([currentX, closeX], [currentY, closeY]);
                currentX = closeX;
                currentY = closeY;
            }
            else if(temp.command === "curveto"){
                if(temp.relative){
                    length += getArcLength(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]);
                    smoothX = currentX + temp.x2;
                    smoothY = currentY + temp.y2;
                    currentX += temp.x;
                    currentY += temp.y;
                }
                else{
                    length += getArcLength(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]);
                    currentX = temp.x;
                    currentY = temp.y;
                    smoothX = temp.x2;
                    smoothY = temp.y2;

                }
            }
            else if(temp.command === "smooth curveto"){
                if(temp.relative){
                    length += getArcLength(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]);
                    currentX += temp.x;
                    currentY += temp.y;
                }
                else{
                    length += getArcLength(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]);
                    currentX = temp.x;
                    currentY = temp.y;

                }
            }
            else if(temp.command === "quadratic curveto"){
                if(temp.relative){
                    length += getArcLength(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]);
                    smoothX = currentX + temp.x1;
                    smoothY = currentY + temp.y1;
                    currentX += temp.x;
                    currentY += temp.y;
                }
                else{
                    length += getArcLength(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]);
                    currentX = temp.x;
                    currentY = temp.y;
                    smoothX = temp.x1;
                    smoothY = temp.y1;

                }
            }
            else if(temp.command === "smooth quadratic curveto"){
                if(temp.relative){
                    length += getArcLength(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]);
                    currentX += temp.x;
                    currentY += temp.y;
                }
                else{
                    length += getArcLength(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]);
                    currentX = temp.x;
                    currentY = temp.y;
                }
            }
            else if(temp.command === "elliptical arc"){
                console.log("Need to implement ellipital arc");
            }
            
        };

        indexOfLastLine = end;
        totalLines--;

    }

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
    if(x_values.length === 3)
        var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1] , x_values[2],y_values[2]);
    else
        var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1]);
    return curve.length();
}
