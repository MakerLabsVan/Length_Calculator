//import required libraries
var bezier = require('bezier-js');  //from https://github.com/Pomax/bezierjs
var fs = require('fs');                     
var svgparser = require('svg-path-parser');    //from https://github.com/hughsk/svg-path-parser
var SVGCurveLib = require('/Users/Jeremy/node_modules/svg-curve-lib/src/js/svg-curve-lib.js');  //from https://github.com/MadLittleMods/svg-curve-lib
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

module.exports.getFilePathLength = getFilePathLength; //make getFilePathLength available for testing

function getFilePathLength(string){
    var smallX = Number.MAX_VALUE;
    var smallY = Number.MAX_VALUE;
    var largeX = Number.MIN_VALUE;
    var largeY = Number.MIN_VALUE;
    var map = {};
    var data = fs.readFileSync(__dirname + string, "utf8");

    while(data.indexOf("xmlns") !== -1){
        var start = data.indexOf("xmlns");
        var end = data.indexOf("\n", start);
        data = data.substring(0, start) + data.substring(end+2);
    }

    var doc = new dom().parseFromString(data);  //parse String into data structure
    var array = xpath.select("//path[@style]", doc);    //find all path nodes with style attribute
    for(var i = 0; i < array.length; i++){
        var path = xpath.select("./@style", array[i]);
        var transform = xpath.select("ancestor::*/@transform", array[i]);
        var transformX = 1;
        var transformY = 1;
        for (var k = 0; k < transform.length; k++){     //take into account transformations
            if(transform[k] !== undefined){
                var temp = transform[k].nodeValue;
                if (temp.indexOf("matrix") !== -1){
                    transformX *= temp.substring(temp.indexOf("(")+1, temp.indexOf(","));
                    var startingIndex = temp.indexOf(",", temp.indexOf(",", temp.indexOf(",") + 1) + 1) + 1;
                    transformY *= temp.substring(startingIndex, temp.indexOf(",", startingIndex));
                }
                else if(temp.indexOf("scale") !== -1 && temp.indexOf(",") !== -1){
                    transformX *= temp.substring(temp.indexOf("(")+1, temp.indexOf(","));
                    transformY *= temp.substring(temp.indexOf(",")+1, temp.indexOf(")"));
                }
                else if(temp.indexOf("scale") !== -1){
                    transformX *= temp.substring(temp.indexOf("(")+1, temp.indexOf(")"));
                    transformY *= 1;
                }
            }
        }
        for(var j = 0; j < path.length; j++){
            var colour = path[j].nodeValue.substring(path[j].nodeValue.indexOf("stroke:")+7,path[j].nodeValue.indexOf("stroke:")+14);   //dealing with opacity, does not calculte length of invisible objects
            if(path[j].nodeValue.indexOf(";",path[j].nodeValue.indexOf(";opacity:")+9) !== -1){
                var opacity = path[j].nodeValue.substring(path[j].nodeValue.indexOf(";opacity:")+9,path[j].nodeValue.indexOf(";",path[j].nodeValue.indexOf(";opacity:")));
            }
            else{
                var opacity = path[j].nodeValue.substring(path[j].nodeValue.indexOf(";opacity:")+9);
            }
            if(opacity !== "0"){
                if(map[colour] != undefined){
                    info = getLength(xpath.select("./@d", array[i])[j].nodeValue, transformX, transformY);
                    map[colour] += info.length;
                    if(smallX > info.smallX){
                        smallX = info.smallX;
                    }
                    if(smallY > info.smallY){
                        smallY = info.smallY;
                    }
                    if(largeX < info.largeX){
                        largeX = info.largeX;
                    }
                    if(largeY < info.largeY){
                        largeY = info.largeY;
                    }
                }
                else{
                    info = getLength(xpath.select("./@d", array[i])[j].nodeValue, transformX, transformY);
                    map[colour] = info.length;
                    if(smallX > info.smallX){
                        smallX = info.smallX;
                    }
                    if(smallY > info.smallY){
                        smallY = info.smallY;
                    }
                    if(largeX < info.largeX){
                        largeX = info.largeX;
                    }
                    if(largeY < info.largeY){
                        largeY = info.largeY;
                    }
                }
            } 
        }
    } 
    map.xWidth = (largeX - smallX) / 90;
    map.yLength = (largeY - smallY) / 90;
    return map;
}

//Calculates length from path data using helper methods
function getLength(string, transform_X, transform_Y){
    var transformX = transform_X;
    var transformY = transform_Y;
    var arrayOfValues = svgparser(string);
    var currentX = 0.0;
    var currentY = 0.0;
    var closeX = 0.0; //for closing path calculations
    var closeY = 0.0;
    var smoothX = 0.0; //for shorthand curve calculations
    var smoothY = 0.0;
    var length = 0.0;
    var smallX = Number.MAX_VALUE;
    var largeX = Number.MIN_VALUE;
    var smallY = Number.MAX_VALUE;
    var largeY = Number.MIN_VALUE;

    for(var i = 0; i < arrayOfValues.length; i++) {
        var temp = arrayOfValues[i];
        switch(temp.command){
            case "moveto":
                if(temp.relative){
                    currentX += temp.x * transformX;
                    currentY += temp.y * transformY;
                    closeX += temp.x * transformX;
                    closeY += temp.y * transformY;
                    if(smallX > currentX){
                        smallX = currentX;
                    }
                    if(smallY > currentY){
                        smallY = currentY;
                    }
                    if(largeX < currentX){
                        largeX = currentX;
                    }
                    if(largeY < currentY){
                        largeY = currentY;
                    }
                }
                else{
                    currentX = temp.x * transformX;
                    currentY = temp.y * transformY;
                    closeX = temp.x * transformX;
                    closeY = temp.y * transformY;
                    if(smallX > currentX){
                        smallX = currentX;
                    }
                    if(smallY > currentY){
                        smallY = currentY;
                    }
                    if(largeX < currentX){
                        largeX = currentX;
                    }
                    if(largeY < currentY){
                        largeY = currentY;
                    }
                }
                break;

            case "lineto":
                if(temp.relative){
                    length += getLineLength([currentX, currentX + temp.x * transformX], [currentY, currentY + temp.y * transformY])
                    currentX += temp.x * transformX;
                    currentY += temp.y * transformY;
                    if(smallX > currentX){
                        smallX = currentX;
                    }
                    if(smallY > currentY){
                        smallY = currentY;
                    }
                    if(largeX < currentX){
                        largeX = currentX;
                    }
                    if(largeY < currentY){
                        largeY = currentY;
                    }
                }
                else{
                    length += getLineLength([currentX, temp.x * transformX], [currentY, temp.y * transformY]);
                    currentX = temp.x * transformX;
                    currentY = temp.y * transformY;
                    if(smallX > currentX){
                        smallX = currentX;
                    }
                    if(smallY > currentY){
                        smallY = currentY;
                    }
                    if(largeX < currentX){
                        largeX = currentX;
                    }
                    if(largeY < currentY){
                        largeY = currentY;
                    }
                }
                break;

            case "horizontal lineto":
                if(temp.relative){
                    length += getLineLength([currentX, currentX + temp.x * transformX], [currentY, currentY])
                    currentX += temp.x * transformX;
                    if(smallX > currentX){
                        smallX = currentX;
                    }
                    if(smallY > currentY){
                        smallY = currentY;
                    }
                    if(largeX < currentX){
                        largeX = currentX;
                    }
                    if(largeY < currentY){
                        largeY = currentY;
                    }
                }
                else{
                    length += getLineLength([currentX, temp.x * transformX], [currentY, currentY]);
                    currentX = temp.x * transformX;
                    if(smallX > currentX){
                        smallX = currentX;
                    }
                    if(smallY > currentY){
                        smallY = currentY;
                    }
                    if(largeX < currentX){
                        largeX = currentX;
                    }
                    if(largeY < currentY){
                        largeY = currentY;
                    }
                }
                break;

            case "vertical lineto":
                if(temp.relative){
                    length += getLineLength([currentX, currentX], [currentY, currentY + temp.y * transformY])
                    currentY += temp.y * transformY;
                    if(smallX > currentX){
                        smallX = currentX;
                    }
                    if(smallY > currentY){
                        smallY = currentY;
                    }
                    if(largeX < currentX){
                        largeX = currentX;
                    }
                    if(largeY < currentY){
                        largeY = currentY;
                    }
                }
                else{
                    length += getLineLength([currentX, currentX], [currentY, temp.y * transformY]);
                    currentY = temp.y * transformY;
                    if(smallX > currentX){
                        smallX = currentX;
                    }
                    if(smallY > currentY){
                        smallY = currentY;
                    }
                    if(largeX < currentX){
                        largeX = currentX;
                    }
                    if(largeY < currentY){
                        largeY = currentY;
                    }
                }
                break;

            case "closepath":
                length += getLineLength([currentX, closeX], [currentY, closeY]);
                currentX = closeX;
                currentY = closeY;
                if(smallX > currentX){
                    smallX = currentX;
                }
                if(smallY > currentY){
                    smallY = currentY;
                }
                if(largeX < currentX){
                    largeX = currentX;
                }
                if(largeY < currentY){
                    largeY = currentY;
                }
                break;

            case "curveto":
                if(temp.relative){
                    length += getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().y.max;
                    }
                    smoothX = currentX + temp.x2 * transformX;
                    smoothY = currentY + temp.y2 * transformY;
                    currentX += temp.x * transformX;
                    currentY += temp.y * transformY;
                }
                else{
                    length += getCurve(currentX, currentY, [temp.x1 * transformX, temp.x2 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y2 * transformY, temp.y * transformY]).length();
                    if(smallX > getCurve(currentX, currentY, [temp.x1 * transformX, temp.x2 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y2 * transformY, temp.y * transformY]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [temp.x1 * transformX, temp.x2 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y2 * transformY, temp.y * transformY]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [temp.x1 * transformX, temp.x2 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y2 * transformY, temp.y * transformY]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [temp.x1 * transformX, temp.x2 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y2 * transformY, temp.y * transformY]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [temp.x1 * transformX, temp.x2 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y2 * transformY, temp.y * transformY]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [temp.x1 * transformX, temp.x2 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y2 * transformY, temp.y * transformY]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [temp.x1 * transformX, temp.x2 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y2 * transformY, temp.y * transformY]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [temp.x1 * transformX, temp.x2 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y2 * transformY, temp.y * transformY]).bbox().y.max;
                    }
                    currentX = temp.x * transformX;
                    currentY = temp.y * transformY;
                    smoothX = temp.x2 * transformX;
                    smoothY = temp.y2 * transformY;
                }
                break;

            case "smooth curveto":
                if(temp.relative){
                    length += getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2 * transformX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y2 * transformY, currentY + temp.y * transformY]).bbox().bbox().y.max;
                    }
                    currentX += temp.x * transformX;
                    currentY += temp.y * transformY;
                }
                else{
                    length += getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2 * transformX, temp.x * transformX], [currentY * 2 - smoothY, temp.y2 * transformY, temp.y * transformY]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2 * transformX, temp.x * transformX], [currentY * 2 - smoothY, temp.y2 * transformY, temp.y * transformY]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2 * transformX, temp.x * transformX], [currentY * 2 - smoothY, temp.y2 * transformY, temp.y * transformY]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2 * transformX, temp.x * transformX], [currentY * 2 - smoothY, temp.y2 * transformY, temp.y * transformY]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2 * transformX, temp.x * transformX], [currentY * 2 - smoothY, temp.y2 * transformY, temp.y * transformY]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2 * transformX, temp.x * transformX], [currentY * 2 - smoothY, temp.y2 * transformY, temp.y * transformY]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2 * transformX, temp.x * transformX], [currentY * 2 - smoothY, temp.y2 * transformY, temp.y * transformY]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2 * transformX, temp.x * transformX], [currentY * 2 - smoothY, temp.y2 * transformY, temp.y * transformY]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2 * transformX, temp.x * transformX], [currentY * 2 - smoothY, temp.y2 * transformY, temp.y * transformY]).bbox().y.max;
                    }
                    currentX = temp.x * transformX;
                    currentY = temp.y * transformY;
                }
                break;

            case "quadratic curveto":
                if(temp.relative){
                    length += getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y * transformY]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y * transformY]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y * transformY]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y * transformY]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y * transformY]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y * transformY]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y * transformY]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y * transformY]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX + temp.x1 * transformX, currentX + temp.x * transformX], [currentY + temp.y1 * transformY, currentY + temp.y * transformY]).bbox().y.max;
                    }
                    smoothX = currentX + temp.x1 * transformX;
                    smoothY = currentY + temp.y1 * transformY;
                    currentX += temp.x * transformX;
                    currentY += temp.y * transformY;
                }
                else{
                    length += getCurve(currentX, currentY, [temp.x1 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y * transformY]).length();
                    if(smallX > getCurve(currentX, currentY, [temp.x1 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y * transformY]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [temp.x1 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y * transformY]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [temp.x1 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y * transformY]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [temp.x1 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y * transformY]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [temp.x1 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y * transformY]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [temp.x1 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y * transformY]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [temp.x1 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y * transformY]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [temp.x1 * transformX, temp.x * transformX], [temp.y1 * transformY, temp.y * transformY]).bbox().y.max;
                    }
                    currentX = temp.x * transformX;
                    currentY = temp.y * transformY;
                    smoothX = temp.x1 * transformX;
                    smoothY = temp.y1 * transformY;
                }
                break;

            case "smooth quadratic cuveto":
                if(temp.relative){
                    length += getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y * transformY]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y * transformY]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y * transformY]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y * transformY]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y * transformY]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y * transformY]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y * transformY]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y * transformY]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x * transformX], [currentY * 2 - smoothY, currentY + temp.y * transformY]).bbox().y.max;
                    }
                    currentX += temp.x * transformX;
                    currentY += temp.y * transformY;
                }
                else{
                    length += getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x * transformX], [currentY * 2 - smoothY, temp.y * transformY]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x * transformX], [currentY * 2 - smoothY, temp.y * transformY]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x * transformX], [currentY * 2 - smoothY, temp.y * transformY]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x * transformX], [currentY * 2 - smoothY, temp.y * transformY]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x * transformX], [currentY * 2 - smoothY, temp.y * transformY]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x * transformX], [currentY * 2 - smoothY, temp.y * transformY]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x * transformX], [currentY * 2 - smoothY, temp.y * transformY]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x * transformX], [currentY * 2 - smoothY, temp.y * transformY]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x * transformX], [currentY * 2 - smoothY, temp.y * transformY]).bbox().y.max;
                    }
                    currentX = temp.x * transformX;
                    currentY = temp.y * transformY;
                }
                break;

            case "elliptical arc":
                if(temp.relative){
                    var ellipticalArcArcLengthResult = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                        return SVGCurveLib.pointOnEllipticalArc({x: currentX , y: currentY}, temp.rx * transformX, temp.ry * transformY, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: currentX + temp.x * transformX, y: currentY + temp.y * transformY}, t);
                    });
                    length += ellipticalArcArcLengthResult.arcLength;
                    currentX += temp.x * transformX;
                    currentY += temp.y * transformY;
                }
                else{
                    var ellipticalArcArcLengthResult = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                        return SVGCurveLib.pointOnEllipticalArc({x: currentX , y: currentY}, temp.rx * transformX, temp.ry * transformY, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: temp.x * transformX, y: temp.y * transformY}, t);
                    });
                    length += ellipticalArcArcLengthResult.arcLength;
                    currentX = temp.x * transformX;
                    currentY = temp.y * transformY;
                }
                break;

            default:
                console.log("Error. Unknown path command.");
        }
    }
    var info = {};
    info.length = length/90;
    info.smallX = smallX;
    info.smallY = smallY;
    info.largeX = largeX;
    info.largeY = largeY;
    return info;
}

//Calculates length of line given array of x,y coordinates
function getLineLength(x_values, y_values){
    var length = 0;
    for(i = 1; i < x_values.length; i++){
        length += Math.sqrt(Math.pow((x_values[i]-x_values[i-1]), 2)+Math.pow((y_values[i]-y_values[i-1]), 2));
    }
    return length;
}

//Returns manipulatable bezier curve
function getCurve(x_current, y_current, x_values, y_values){
    if(x_values.length === 3)
        var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1] , x_values[2],y_values[2]);
    else
        var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1]);
    return curve;
}