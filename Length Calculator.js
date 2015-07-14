//import required libraries
var bezier = require('bezier-js');  //from https://github.com/Pomax/bezierjs
var fs = require('fs');                     
var svgparser = require('svg-path-parser');    //from https://github.com/hughsk/svg-path-parser
var SVGCurveLib = require('/Users/Jeremy/node_modules/svg-curve-lib/src/js/svg-curve-lib.js');  //from https://github.com/MadLittleMods/svg-curve-lib
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

module.exports.getFilePathLength = getFilePathLength; //make getFilePathLength available for testing

console.log(getFilePathLength("/test_files/number1.svg"));

function getFilePathLength(string){
    var map = {smallX:Number.MAX_VALUE, smallY:Number.MAX_VALUE, largeX:Number.MIN_VALUE, largeY:Number.MIN_VALUE};
    var data = fs.readFileSync(__dirname + string, "utf8");

    while(data.indexOf("xmlns") !== -1){
        var start = data.indexOf("xmlns");
        var end = data.indexOf("\n", start);
        data = data.substring(0, start) + data.substring(end+2);
    }

    var doc = new dom().parseFromString(data);  //parse String into data structure
    var array = xpath.select("//path", doc);    //find all path nodes

    for(var i = 0; i < array.length; i++){
        var path = xpath.select("./@style", array[i]);
        for(var j = 0; j < path.length; j++){
            var colour = path[j].nodeValue.substring(path[j].nodeValue.indexOf("stroke:")+7,path[j].nodeValue.indexOf("stroke:")+14);
            if(path[j].nodeValue.indexOf(";",path[j].nodeValue.indexOf(";opacity:")+9) !== -1){
                var opacity = path[j].nodeValue.substring(path[j].nodeValue.indexOf(";opacity:")+9,path[j].nodeValue.indexOf(";",path[j].nodeValue.indexOf(";opacity:")));
            }
            else{
                var opacity = path[j].nodeValue.substring(path[j].nodeValue.indexOf(";opacity:")+9);
            }
            if(opacity !== "0"){
                if(map[colour] != undefined){
                    info = getLength(xpath.select("./@d", array[i])[j].nodeValue);
                    map[colour] += info.length;
                    if(map.smallX > info.smallX){
                        map.smallX = info.smallX;
                    }
                    if(map.smallY > info.smallY){
                        map.smallY = info.smallY;
                    }
                    if(map.largeX < info.largeX){
                        map.largeX = info.largeX;
                    }
                    if(map.largeY < info.largeY){
                        map.largeY = info.largeY;
                    }
                }
                else{
                    info = getLength(xpath.select("./@d", array[i])[j].nodeValue);
                    map[colour] = info.length;
                    if(map.smallX > info.smallX){
                        map.smallX = info.smallX;
                    }
                    if(map.smallY > info.smallY){
                        map.smallY = info.smallY;
                    }
                    if(map.largeX < info.largeX){
                        map.largeX = info.largeX;
                    }
                    if(map.largeY < info.largeY){
                        map.largeY = info.largeY;
                    }
                }
            } 
        }
    } 
    map.xWidth = map.largeX - map.smallX;
    map.yLength = map.largeY - map.smallY;
    return map;
}

//Calculates length from path data using helper methods
function getLength(string){
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
                    currentX += temp.x;
                    currentY += temp.y;
                    closeX += temp.x;
                    closeY += temp.y;
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
                    currentX = temp.x;
                    currentY = temp.y;
                    closeX = temp.x;
                    closeY = temp.y;
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
                    length += getLineLength([currentX, currentX + temp.x], [currentY, currentY + temp.y])
                    currentX += temp.x;
                    currentY += temp.y;
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
                    length += getLineLength([currentX, temp.x], [currentY, temp.y]);
                    currentX = temp.x;
                    currentY = temp.y;
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
                    length += getLineLength([currentX, currentX + temp.x], [currentY, currentY])
                    currentX += temp.x;
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
                    length += getLineLength([currentX, temp.x], [currentY, currentY]);
                    currentX = temp.x;
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
                    length += getLineLength([currentX, currentX], [currentY, currentY + temp.y])
                    currentY += temp.y;
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
                    length += getLineLength([currentX, currentX], [currentY, temp.y]);
                    currentY = temp.y;
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
                    length += getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x2, currentX + temp.x], [currentY + temp.y1, currentY + temp.y2, currentY + temp.y]).bbox().y.max;
                    }
                    smoothX = currentX + temp.x2;
                    smoothY = currentY + temp.y2;
                    currentX += temp.x;
                    currentY += temp.y;
                }
                else{
                    length += getCurve(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]).length();
                    if(smallX > getCurve(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [temp.x1, temp.x2, temp.x], [temp.y1, temp.y2, temp.y]).bbox().y.max;
                    }
                    currentX = temp.x;
                    currentY = temp.y;
                    smoothX = temp.x2;
                    smoothY = temp.y2;
                }
                break;

            case "smooth curveto":
                if(temp.relative){
                    length += getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]).bbox().bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]).bbox().bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]).bbox().bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]).bbox().bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]).bbox().bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]).bbox().bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]).bbox().bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x2, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y2, currentY + temp.y]).bbox().bbox().y.max;
                    }
                    currentX += temp.x;
                    currentY += temp.y;
                }
                else{
                    length += getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x2, temp.x], [currentY * 2 - smoothY, temp.y2, temp.y]).bbox().y.max;
                    }
                    currentX = temp.x;
                    currentY = temp.y;
                }
                break;

            case "quadratic curveto":
                if(temp.relative){
                    length += getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX + temp.x1, currentX + temp.x], [currentY + temp.y1, currentY + temp.y]).bbox().y.max;
                    }
                    smoothX = currentX + temp.x1;
                    smoothY = currentY + temp.y1;
                    currentX += temp.x;
                    currentY += temp.y;
                }
                else{
                    length += getCurve(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]).length();
                    if(smallX > getCurve(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [temp.x1, temp.x], [temp.y1, temp.y]).bbox().y.max;
                    }
                    currentX = temp.x;
                    currentY = temp.y;
                    smoothX = temp.x1;
                    smoothY = temp.y1;
                }
                break;

            case "smooth quadratic cuveto":
                if(temp.relative){
                    length += getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX * 2 - smoothX, currentX + temp.x], [currentY * 2 - smoothY, currentY + temp.y]).bbox().y.max;
                    }
                    currentX += temp.x;
                    currentY += temp.y;
                }
                else{
                    length += getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]).length();
                    if(smallX > getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]).bbox().x.min){
                        smallX = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]).bbox().x.min;
                    }
                    if(smallY > getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]).bbox().y.min){
                        smallY = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]).bbox().y.min;
                    }
                    if(largeX < getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]).bbox().x.max){
                        largeX = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]).bbox().x.max;
                    }
                    if(largeY < getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]).bbox().y.max){
                        largeY = getCurve(currentX, currentY, [currentX * 2 - smoothX, temp.x], [currentY * 2 - smoothY, temp.y]).bbox().y.max;
                    }
                    currentX = temp.x;
                    currentY = temp.y;
                }
                break;

            case "elliptical arc":
                if(temp.relative){
                    var ellipticalArcArcLengthResult = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                        return SVGCurveLib.pointOnEllipticalArc({x: currentX , y: currentY}, temp.rx, temp.ry, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: currentX + temp.x, y: currentY + temp.y}, t);
                    });
                    length += ellipticalArcArcLengthResult.arcLength;
                    currentX += temp.x;
                    currentY += temp.y;
                }
                else{
                    var ellipticalArcArcLengthResult = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                        return SVGCurveLib.pointOnEllipticalArc({x: currentX , y: currentY}, temp.rx, temp.ry, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: temp.x, y: temp.y}, t);
                    });
                    length += ellipticalArcArcLengthResult.arcLength;
                    currentX = temp.x;
                    currentY = temp.y;
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