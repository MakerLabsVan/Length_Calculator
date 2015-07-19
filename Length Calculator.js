//import required libraries
var bezier = require('bezier-js');  //from https://github.com/Pomax/bezierjs
var fs = require('fs');                     
var svgparser = require('svg-path-parser');    //from https://github.com/hughsk/svg-path-parser
var SVGCurveLib = require('/Users/Jeremy/node_modules/svg-curve-lib/src/js/svg-curve-lib.js');  //from https://github.com/MadLittleMods/svg-curve-lib
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var materials_data = require('/Users/Jeremy/Materials_Data/Materials_Data.js');
var prompt = require('prompt');

//make functions available for testing
module.exports.getFilePathLength = getFilePathLength;
module.exports.getCost = getCost; 


//web server interface (accepts file and settings, returns cost using nodejs), port to browser side

// console.log(getFilePathLength("/test_files/group1.svg"));

//command line interface
// prompt.start();
// prompt.get(['material', 'file', 'membership'], function(err, result){
//     console.log(getCost(result.material, result.file, result.membership));
// });

//costs calculations
function getCost(material, file, membership){
    var data = getFilePathLength(file, MLV.materials[material].passes);
    var cost = {
        time: 0,
        money: 0,
        pathLength: data.total,     //calculates costs of all colours for now
        jogLength: data.jogLength
    };
    cost.time += cost.pathLength / (MLV.laserSpeed.maxCutSpeed * MLV.materials[material].speed / 100);
    cost.time += cost.jogLength / MLV.laserSpeed.maxJogSpeed;
    cost.time = cost.time / 60; //convert from minutes to seconds
    cost.money = cost.time * MLV.cost[membership];
    return cost;
}

//get path length of file
function getFilePathLength(string, passes){
    passes = passes || 1;
    var smallX = Number.MAX_VALUE;
    var smallY = Number.MAX_VALUE;
    var largeX = -Number.MAX_VALUE;
    var largeY = -Number.MAX_VALUE;
    var jog = {x: 0, y:0 };
    var map = {jogLength: 0, total:0};
    var data = fs.readFileSync(__dirname + string, 'utf8');

    while(data.indexOf('xmlns') !== -1){
        var start = data.indexOf('xmlns');
        var end = data.indexOf('\n', start);
        data = data.substring(0, start) + data.substring(end+2);
    }

    var doc = new dom().parseFromString(data);      //parse String into data structure
    var array = xpath.select('//path[@style]', doc);    //find all path nodes with style attribute
    for(var i = 0; i < array.length; i++){
        var path = xpath.select('./@style', array[i]);
        var transform = xpath.select('ancestor::*/@transform', array[i]);
        var transformX = 1;
        var transformY = 1;
        var translateX = 0;
        var translateY = 0;
        for (var k = 0; k < transform.length; k++){     //take into account transformations
            if(transform[k] !== undefined){
                var temp = transform[k].nodeValue;
                if (temp.indexOf('matrix') !== -1){
                    transformX *= temp.substring(temp.indexOf('(')+1, temp.indexOf(','));
                    var startingIndex = temp.indexOf(',', temp.indexOf(',', temp.indexOf(',') + 1) + 1) + 1;
                    transformY *= temp.substring(startingIndex, temp.indexOf(',', startingIndex));
                    translateX += parseFloat(temp.substring(temp.lastIndexOf(',', temp.lastIndexOf(',') - 1) + 1, temp.lastIndexOf(',')));
                    translateY += parseFloat(temp.substring(temp.lastIndexOf(',') + 1, temp.indexOf(')')));
                }
                else if(temp.indexOf('scale') !== -1 && temp.indexOf(',') !== -1){
                    transformX *= temp.substring(temp.indexOf('(')+1, temp.indexOf(','));
                    transformY *= temp.substring(temp.indexOf(',')+1, temp.indexOf(')'));
                }
                else if(temp.indexOf('scale') !== -1){
                    transformX *= temp.substring(temp.indexOf('(')+1, temp.indexOf(')'));
                    transformY *= 1;
                }
                else if(temp.indexOf('translate') !== -1){
                    translateX += parseFloat(temp.substring(temp.indexOf('(')+1, temp.indexOf(',')));
                    translateY += parseFloat(temp.substring(temp.indexOf(',')+1, temp.indexOf(')')));
                }
            }
        }
        var style_array = path[0].nodeValue.split(';');
        var style = {};     //create object containing style attributes
        for(var l = 0; l < style_array.length; l++){
            style[style_array[l].substring(0,style_array[l].indexOf(":"))] = style_array[l].substring(style_array[l].indexOf(":")+1);
        }
        var colour = style.stroke;
        var info = getLength(xpath.select('./@d', array[i])[0].nodeValue, transformX, transformY, translateX, translateY, passes);
        var width = toInches(xpath.select('/svg/@width', doc)[0].nodeValue);
        var height = toInches(xpath.select('/svg/@height', doc)[0].nodeValue);
        if((style.opacity === undefined || style.opacity !== '0') && info.smallX >= 0 && info.smallY >= 0 && info.largeX <= width && info.largeY <= height){ //opacity and in-bounds check
            map.jogLength += getLineLength([jog.x, info.startX], [jog.y, info.startY]);
            jog.x = info.endX;
            jog.y = info.endY;
            if(map[colour] != undefined){
                map[colour] += info.length;
                map.total += info.length;
                map.jogLength += info.jogLength;
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
                map[colour] = info.length;
                map.total += info.length;
                map.jogLength += info.jogLength;
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
    map.jogLength += getLineLength([jog.x, 0], [jog.y, 0]);
    map.xWidth = largeX - smallX;
    map.yLength = largeY - smallY;
    return map;
}

//Calculates length from path data using helper methods
function getLength(string, transform_X, transform_Y, translate_X, translate_Y, passes){
    var passes = passes;
    var transformX = transform_X || 1;
    var transformY = transform_Y || 1;
    var translateX = translate_X || 0;
    var translateY = translate_Y || 0;
    var startX = 0;
    var startY = 0;
    var values = {
        currentX: 0,
        currentY: 0,
        smallX: Number.MAX_VALUE,
        largeX: -Number.MAX_VALUE,
        smallY: Number.MAX_VALUE,
        largeY: -Number.MAX_VALUE,
        closeX: 0, //for closing path calculations
        closeY: 0,
        smoothX: 0, //for shorthand curve calculations
        smoothY: 0
    };
    var arrayOfValues = svgparser(string);
    var length = 0;
    var jogLength = 0;

    for(var i = 0; i < arrayOfValues.length; i++) {
        var temp = arrayOfValues[i];
        switch(temp.command){
            case 'moveto':
                if(temp.relative){
                    if(i != 0){
                        jogLength += getLineLength([values.currentX, values.currentX + temp.x * transformX], [values.currentY, values.currentY + temp.y * transformY])
                    }
                    else{
                        startX = temp.x * transformX;
                        startY = temp.y * transformY;
                    }
                    values.currentX += temp.x * transformX;
                    values.currentY += temp.y * transformY;
                    values.closeX += temp.x * transformX;
                    values.closeY += temp.y * transformY;
                    compareLineValues(values);
                }
                else{
                    if(i != 0){
                        jogLength += getLineLength([values.currentX, temp.x * transformX], [values.currentY, temp.y * transformY]);
                    }
                    else{
                        startX = temp.x * transformX;
                        startY = temp.y * transformY;
                    }
                    values.currentX = temp.x * transformX;
                    values.currentY = temp.y * transformY;
                    values.closeX = temp.x * transformX;
                    values.closeY = temp.y * transformY;
                    compareLineValues(values);
                }
                break;

            case 'lineto':
                if(temp.relative){
                    length += getLineLength([values.currentX, values.currentX + temp.x * transformX], [values.currentY, values.currentY + temp.y * transformY])
                    values.currentX += temp.x * transformX;
                    values.currentY += temp.y * transformY;
                    compareLineValues(values);
                }
                else{
                    length += getLineLength([values.currentX, temp.x * transformX], [values.currentY, temp.y * transformY]);
                    values.currentX = temp.x * transformX;
                    values.currentY = temp.y * transformY;
                    compareLineValues(values);
                }
                break;

            case 'horizontal lineto':
                if(temp.relative){
                    length += getLineLength([values.currentX, values.currentX + temp.x * transformX], [values.currentY, values.currentY])
                    values.currentX += temp.x * transformX;
                    compareLineValues(values);
                }
                else{
                    length += getLineLength([values.currentX, temp.x * transformX], [values.currentY, values.currentY]);
                    values.currentX = temp.x * transformX;
                    compareLineValues(values);
                }
                break;

            case 'vertical lineto':
                if(temp.relative){
                    length += getLineLength([values.currentX, values.currentX], [values.currentY, values.currentY + temp.y * transformY])
                    values.currentY += temp.y * transformY;
                    compareLineValues(values);
                }
                else{
                    length += getLineLength([values.currentX, values.currentX], [values.currentY, temp.y * transformY]);
                    values.currentY = temp.y * transformY;
                    compareLineValues(values);
                }
                break;

            case 'closepath':
                length += getLineLength([values.currentX, values.closeX], [values.currentY, values.closeY]);
                values.currentX = values.closeX;
                values.currentY = values.closeY;
                compareLineValues(values);
                break;

            case 'curveto':
                if(temp.relative){
                    var args = [
                        values.currentX,
                        values.currentY,
                        [
                            values.currentX + temp.x1 * transformX,
                            values.currentX + temp.x2 * transformX,
                            values.currentX + temp.x * transformX
                        ], [
                            values.currentY + temp.y1 * transformY,
                            values.currentY + temp.y2 * transformY,
                            values.currentY + temp.y * transformY]
                    ];
                    length += getCurve.apply(null, args).length();
                    compareCurveValues(values,args);
                    values.smoothX = values.currentX + temp.x2 * transformX;
                    values.smoothY = values.currentY + temp.y2 * transformY;
                    values.currentX += temp.x * transformX;
                    values.currentY += temp.y * transformY;
                }
                else{
                    var args = [
                        values.currentX, 
                        values.currentY, 
                        [
                            temp.x1 * transformX, 
                            temp.x2 * transformX, 
                            temp.x * transformX
                        ], [
                            temp.y1 * transformY, 
                            temp.y2 * transformY, 
                            temp.y * transformY]
                    ];
                    length += getCurve.apply(null, args).length();
                    compareCurveValues(values,args);
                    values.currentX = temp.x * transformX;
                    values.currentY = temp.y * transformY;
                    values.smoothX = temp.x2 * transformX;
                    values.smoothY = temp.y2 * transformY;
                }
                break;

            case 'smooth curveto':
                if(temp.relative){
                    var args = [
                        values.currentX,
                        values.currentY,
                        [
                            values.currentX * 2 - values.smoothX,
                            values.currentX + temp.x2 * transformX,
                            values.currentX + temp.x * transformX
                        ], [
                            values.currentY * 2 - values.smoothY,
                            values.currentY + temp.y2 * transformY,
                            values.currentY + temp.y * transformY
                        ]
                    ];
                    length += getCurve.apply(null, args).length();
                    compareCurveValues(values,args);
                    values.currentX += temp.x * transformX;
                    values.currentY += temp.y * transformY;
                }
                else{
                    var args = [
                        values.currentX,
                        values.currentY,
                        [
                            values.currentX * 2 - values.smoothX,
                            temp.x2 * transformX,
                            temp.x * transformX
                        ],[
                            values.currentY * 2 - values.smoothY,
                            temp.y2 * transformY, temp.y * transformY
                        ]
                    ];
                    length += getCurve.apply(null, args).length();
                    compareCurveValues(values,args);
                    values.currentX = temp.x * transformX;
                    values.currentY = temp.y * transformY;
                }
                break;

            case 'quadratic curveto':
                if(temp.relative){
                    var args = [
                        values.currentX,
                        values.currentY,
                        [
                            values.currentX + temp.x1 * transformX,
                            values.currentX + temp.x * transformX
                        ], [
                            values.currentY + temp.y1 * transformY,
                            values.currentY + temp.y * transformY
                        ]
                    ];
                    length += getCurve.apply(null, args).length();
                    compareCurveValues(values,args);
                    values.smoothX = values.currentX + temp.x1 * transformX;
                    values.smoothY = values.currentY + temp.y1 * transformY;
                    values.currentX += temp.x * transformX;
                    values.currentY += temp.y * transformY;
                }
                else{
                    var args = [
                        values.currentX,
                        values.currentY,
                        [
                            temp.x1 * transformX,
                            temp.x * transformX
                        ], [
                            temp.y1 * transformY,
                            temp.y * transformY
                        ]
                    ];
                    length += getCurve.apply(null, args).length();
                    compareCurveValues(values,args);
                    values.currentX = temp.x * transformX;
                    values.currentY = temp.y * transformY;
                    values.smoothX = temp.x1 * transformX;
                    values.smoothY = temp.y1 * transformY;
                }
                break;

            case 'smooth quadratic cuveto':
                if(temp.relative){
                    var args = [
                        values.currentX,
                        values.currentY,
                        [
                            values.currentX * 2 - values.smoothX,
                            values.currentX + temp.x * transformX
                        ], [
                            values.currentY * 2 - values.smoothY,
                            values.currentY + temp.y * transformY
                        ]
                    ];
                    length += getCurve.apply(null, args).length();
                    compareCurveValues(values,args);
                    values.currentX += temp.x * transformX;
                    values.currentY += temp.y * transformY;
                }
                else{
                    var args = [
                        values.currentX,
                        values.currentY,
                        [
                            values.currentX * 2 - values.smoothX,
                            temp.x * transformX
                        ], [
                            values.currentY * 2 - values.smoothY,
                            temp.y * transformY
                        ]
                    ];
                    length += getCurve.apply(null, args).length();
                    compareCurveValues(values,args);
                    values.currentX = temp.x * transformX;
                    values.currentY = temp.y * transformY;
                }
                break;

            case 'elliptical arc':
                if(temp.relative){
                    var ellipticalArcArcLengthResult = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                        var point = SVGCurveLib.pointOnEllipticalArc({x: values.currentX , y: values.currentY}, temp.rx * transformX, temp.ry * transformY, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: values.currentX + temp.x * transformX, y: values.currentY + temp.y * transformY}, t);
                        compareArcValues(values,point);
                        return point;
                    });
                    length += ellipticalArcArcLengthResult.arcLength;
                    values.currentX += temp.x * transformX;
                    values.currentY += temp.y * transformY;
                }
                else{
                    var ellipticalArcArcLengthResult = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                        var point = SVGCurveLib.pointOnEllipticalArc({x: values.currentX , y: values.currentY}, temp.rx * transformX, temp.ry * transformY, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: temp.x * transformX, y: temp.y * transformY}, t);
                        compareArcValues(values,point);
                        return point;
                    });
                    length += ellipticalArcArcLengthResult.arcLength;
                    values.currentX = temp.x * transformX;
                    values.currentY = temp.y * transformY;
                }
                break;

            default:
                console.log('Error. Unknown path command.');
        }
    }
    var info = {};
    var PIXELS_PER_INCH = 90; //dividng by 90 to convert pixels into inches
    info.length = length/PIXELS_PER_INCH * passes;
    info.jogLength = jogLength/PIXELS_PER_INCH * passes;
    info.jogLength += getLineLength([values.currentX, values.closeX], [values.currentY, values.closeY]) * (passes - 1) / 90;
    info.smallX = values.smallX/PIXELS_PER_INCH + translateX/PIXELS_PER_INCH;
    info.smallY = values.smallY/PIXELS_PER_INCH + translateY/PIXELS_PER_INCH;
    info.largeX = values.largeX/PIXELS_PER_INCH + translateX/PIXELS_PER_INCH;
    info.largeY = values.largeY/PIXELS_PER_INCH + translateY/PIXELS_PER_INCH;
    info.startX = startX/PIXELS_PER_INCH + translateX/PIXELS_PER_INCH;
    info.startY = startY/PIXELS_PER_INCH + translateY/PIXELS_PER_INCH;
    info.endX = values.currentX/PIXELS_PER_INCH + translateX/PIXELS_PER_INCH;
    info.endY = values.currentY/PIXELS_PER_INCH + translateY/PIXELS_PER_INCH;
    return info;
}

//calculates length of line given array of x,y coordinates
function getLineLength(x_values, y_values){
    var length = 0;
    for(i = 1; i < x_values.length; i++){
        length += Math.sqrt(Math.pow((x_values[i]-x_values[i-1]), 2)+Math.pow((y_values[i]-y_values[i-1]), 2));
    }
    return length;
}

//returns manipulatable bezier curve
function getCurve(x_current, y_current, x_values, y_values){
    if(x_values.length === 3)
        var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1] , x_values[2],y_values[2]);
    else
        var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1]);
    return curve;
}

//compares minimum and maximum coordinates of lines for bounding box calculations
function compareLineValues(values){
    if(values.smallX > values.currentX){
        values.smallX = values.currentX;
    }
    if(values.smallY > values.currentY){
        values.smallY = values.currentY;
    }
    if(values.largeX < values.currentX){
        values.largeX = values.currentX;
    }
    if(values.largeY < values.currentY){
        values.largeY = values.currentY;
    }
}

//compares minimum and maximum coordinates of bezier curves for bounding box calculations
function compareCurveValues(values, args){
    if(values.smallX > getCurve.apply(null, args).bbox().x.min){
        values.smallX = getCurve.apply(null, args).bbox().x.min;
    }
    if(values.smallY > getCurve.apply(null, args).bbox().y.min){
        values.smallY = getCurve.apply(null, args).bbox().y.min;
    }
    if(values.largeX < getCurve.apply(null, args).bbox().x.max){
        values.largeX = getCurve.apply(null, args).bbox().x.max;
    }
    if(values.largeY < getCurve.apply(null, args).bbox().y.max){
        values.largeY = getCurve.apply(null, args).bbox().y.max;
    }
}

//compares minimum and maximum coordinates of elliptical arcs for bounding box calculations
function compareArcValues(values, point){
    if(values.smallX > point.x){
        values.smallX = point.x;
    }
    if(values.smallY > point.y){
        values.smallY = point.y;
    }
    if(values.largeX < point.x){
        values.largeX = point.x;
    }
    if(values.largeY < point.y){
        values.largeY = point.y;
    }
}

//converts units to inches
function toInches(string){
    if(string.indexOf('in') != -1){
        return parseFloat(string.substring(0,string.indexOf('in')));
    }
    else if(string.indexOf('cm') != -1){
        return parseFloat(string.substring(0,string.indexOf('cm'))) / 2.54;
    }
    else if(string.indexOf('mm') != -1){
        return parseFloat(string.substring(0,string.indexOf('mm'))) / 25.4;
    }
    else if(string.indexOf('pt') != -1){
        return parseFloat(string.substring(0,string.indexOf('pt'))) / 72;
    }
    else if(string.indexOf('pc') != -1){
        return parseFloat(string.substring(0,string.indexOf('pc'))) / 6;
    }
    else{
        return parseFloat(string) / 90;
    }
}