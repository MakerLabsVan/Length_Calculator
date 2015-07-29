//import required libraries
var bezier = require('bezier-js');  //from https://github.com/Pomax/bezierjs
var fs = require('fs');                     
var svgparser = require('svg-path-parser');    //from https://github.com/hughsk/svg-path-parser
var SVGCurveLib = require(__dirname + '/svg_curve_lib.js');  //from https://github.com/MadLittleMods/svg-curve-lib
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var materials_data = require(__dirname + '/../materials_data/materials_data.js');
var prompt = require('prompt');

//Its not about the length or cleanliness of the code. Its about sending a message.

//command line interface
prompt.start();
prompt.get(['material', 'file', 'membership'], function(err, result){
    console.log(LC.getCost(result.material, result.file, result.membership));
});

var LC = {
    //costs calculations
    getCost: function(material, file, membership, mode, resolution){
        var mode = mode || "vector";
        var resolution = resolution || 252
        if (mode === "vector"){
            var data = LC.getFilePathLength(file, MLV.materials[material].passes);
            var cost = {
                pathLength: data.total,     //calculates costs of all colours for now
                jogLengthX: data.jogLengthX,
                jogLengthY: data.jogLengthY
            };
            cost.time = cost.pathLength / (MLV.laserSpeed.maxCutSpeed * MLV.materials[material].speed / 100);
            cost.time += cost.jogLengthX / MLV.laserSpeed.maxJogSpeedX;
            cost.time += cost.jogLengthY / MLV.laserSpeed.maxJogSpeedY;
            cost.time = cost.time / 60; //convert from seconds to minutes
            cost.money = cost.time * MLV.cost[membership];
            return cost;
        }
        else{
            var data = LC.getFilePathLength(file);
            var cost = {
                xWidth: data.xWidth,
                yLength: data.yLength
            };
            cost.time = cost.xWidth / MLV.laserSpeed.maxRasterSpeed;
            cost.time = cost.time * cost.yLength * resolution;
            cost.time = cost.time / 60;
            cost.money = cost.time * MLV.cost[membership];
            return cost;
        }
    },

    //get path length of file
    getFilePathLength: function(string, passes){
        var passes = passes || 1;
        var smallX = Number.MAX_VALUE;
        var smallY = Number.MAX_VALUE;
        var largeX = -Number.MAX_VALUE;
        var largeY = -Number.MAX_VALUE;
        var startX = 0;
        var startY = 0;
        var jog = {x: 0, y: 0 };
        var map = {jogLengthX: 0, jogLengthY:0, total:0};
        var data = fs.readFileSync(__dirname + '/..' + string, 'utf8');

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
            var info = LC.getLength(xpath.select('./@d', array[i])[0].nodeValue, transformX, transformY, translateX, translateY, passes);
            var width = LC.toInches(xpath.select('/svg/@width', doc)[0].nodeValue);
            var height = LC.toInches(xpath.select('/svg/@height', doc)[0].nodeValue);
            if((style.opacity === undefined || style.opacity !== '0') && info.smallX >= 0 && info.smallY >= 0 && info.largeX <= width && info.largeY <= height){ //opacity and in-bounds check
                if(i != 0){
                    map.jogLengthX += LC.getLineLength([jog.x, info.startX], [jog.y, jog.y]);
                    map.jogLengthY += LC.getLineLength([jog.x, jog.x], [jog.y, info.startY]);
                }
                else{
                    startX = info.startX;
                    startY = info.startY;
                }
                jog.x = info.endX;
                jog.y = info.endY;
                if(map[colour] !== undefined){
                    map[colour] += info.length;
                    map.total += info.length;
                    map.jogLengthX += info.jogLengthX;
                    map.jogLengthY += info.jogLengthY;
                    smallX = Math.min(smallX, info.smallX);
                    smallY = Math.min(smallY, info.smallY);
                    largeX = Math.max(largeX, info.largeX);
                    largeY = Math.max(largeY, info.largeY);
                }
                else{
                    map[colour] = info.length;
                    map.total += info.length;
                    map.jogLengthX += info.jogLengthX;
                    map.jogLengthY += info.jogLengthY;
                    smallX = Math.min(smallX, info.smallX);
                    smallY = Math.min(smallY, info.smallY);
                    largeX = Math.max(largeX, info.largeX);
                    largeY = Math.max(largeY, info.largeY);
                }
            } 
        } 
        map.jogLengthX += LC.getLineLength([jog.x, smallX], [jog.y, jog.y]);
        map.jogLengthX += LC.getLineLength([startX, smallX], [startY, startY]);
        map.jogLengthY += LC.getLineLength([jog.x, jog.x], [jog.y, smallY]);
        map.jogLengthY += LC.getLineLength([startX, startX], [startY, smallY]);
        map.xWidth = largeX - smallX;
        map.yLength = largeY - smallY;
        map.perimeter = map.xWidth * 2 + map.yLength * 2;
        return map;
    },

    //Calculates length from path data using helper methods
    getLength: function(string, transform_X, transform_Y, translate_X, translate_Y, passes){
        var passes = passes || 1;
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
        var jogLengthX = 0;
        var jogLengthY = 0;

        for(var i = 0; i < arrayOfValues.length; i++) {
            var temp = arrayOfValues[i];
            switch(temp.command){
                case 'moveto':
                    if(temp.relative){
                        if(i !== 0){
                            jogLengthX += LC.getLineLength([values.currentX, values.currentX + temp.x * transformX], [values.currentY, values.currentY]);
                            jogLengthY += LC.getLineLength([values.currentX, values.currentX], [values.currentY, values.currentY + temp.y * transformY]);
                        }
                        else{
                            startX = temp.x * transformX;
                            startY = temp.y * transformY;
                        }
                        values.currentX += temp.x * transformX;
                        values.currentY += temp.y * transformY;
                        values.closeX += temp.x * transformX;
                        values.closeY += temp.y * transformY;
                        LC.compareLineValues(values);
                    }
                    else{
                        if(i !== 0){
                            jogLengthX += LC.getLineLength([values.currentX, temp.x * transformX], [values.currentY, values.currentY]);
                            jogLengthY += LC.getLineLength([values.currentX, values.currentX], [values.currentY, temp.y * transformY]);
                        }
                        else{
                            startX = temp.x * transformX;
                            startY = temp.y * transformY;
                        }
                        values.currentX = temp.x * transformX;
                        values.currentY = temp.y * transformY;
                        values.closeX = temp.x * transformX;
                        values.closeY = temp.y * transformY;
                        LC.compareLineValues(values);
                    }
                    break;

                case 'lineto':
                    if(temp.relative){
                        length += LC.getLineLength([values.currentX, values.currentX + temp.x * transformX], [values.currentY, values.currentY + temp.y * transformY]);
                        values.currentX += temp.x * transformX;
                        values.currentY += temp.y * transformY;
                        LC.compareLineValues(values);
                    }
                    else{
                        length += LC.getLineLength([values.currentX, temp.x * transformX], [values.currentY, temp.y * transformY]);
                        values.currentX = temp.x * transformX;
                        values.currentY = temp.y * transformY;
                        LC.compareLineValues(values);
                    }
                    break;

                case 'horizontal lineto':
                    if(temp.relative){
                        length += LC.getLineLength([values.currentX, values.currentX + temp.x * transformX], [values.currentY, values.currentY]);
                        values.currentX += temp.x * transformX;
                        LC.compareLineValues(values);
                    }
                    else{
                        length += LC.getLineLength([values.currentX, temp.x * transformX], [values.currentY, values.currentY]);
                        values.currentX = temp.x * transformX;
                        LC.compareLineValues(values);
                    }
                    break;

                case 'vertical lineto':
                    if(temp.relative){
                        length += LC.getLineLength([values.currentX, values.currentX], [values.currentY, values.currentY + temp.y * transformY]);
                        values.currentY += temp.y * transformY;
                        LC.compareLineValues(values);
                    }
                    else{
                        length += LC.getLineLength([values.currentX, values.currentX], [values.currentY, temp.y * transformY]);
                        values.currentY = temp.y * transformY;
                        LC.compareLineValues(values);
                    }
                    break;

                case 'closepath':
                    length += LC.getLineLength([values.currentX, values.closeX], [values.currentY, values.closeY]);
                    values.currentX = values.closeX;
                    values.currentY = values.closeY;
                    LC.compareLineValues(values);
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
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
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
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
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
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
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
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
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
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
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
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
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
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
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
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
                        values.currentX = temp.x * transformX;
                        values.currentY = temp.y * transformY;
                    }
                    break;

                case 'elliptical arc':
                    if(temp.relative){
                        var ellipticalArc = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                            var point = SVGCurveLib.pointOnEllipticalArc({x: values.currentX , y: values.currentY}, temp.rx * transformX, temp.ry * transformY, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: values.currentX + temp.x * transformX, y: values.currentY + temp.y * transformY}, t);
                            LC.compareArcValues(values,point);
                            return point;
                        });
                        length += ellipticalArc.arcLength;
                        values.currentX += temp.x * transformX;
                        values.currentY += temp.y * transformY;
                    }
                    else{
                        var ellipticalArc = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                            var point = SVGCurveLib.pointOnEllipticalArc({x: values.currentX , y: values.currentY}, temp.rx * transformX, temp.ry * transformY, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: temp.x * transformX, y: temp.y * transformY}, t);
                            LC.compareArcValues(values,point);
                            return point;
                        });
                        length += ellipticalArc.arcLength;
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
        info.jogLengthX = jogLengthX/PIXELS_PER_INCH * passes;
        info.jogLengthX += LC.getLineLength([values.currentX, values.closeX], [values.currentY, values.currentY]) * (passes - 1) / 90;
        info.jogLengthY = jogLengthY/PIXELS_PER_INCH * passes;
        info.jogLengthY += LC.getLineLength([values.currentX, values.currentX], [values.currentY, values.closeY]) * (passes - 1) / 90;
        info.smallX = values.smallX/PIXELS_PER_INCH + translateX/PIXELS_PER_INCH;
        info.smallY = values.smallY/PIXELS_PER_INCH + translateY/PIXELS_PER_INCH;
        info.largeX = values.largeX/PIXELS_PER_INCH + translateX/PIXELS_PER_INCH;
        info.largeY = values.largeY/PIXELS_PER_INCH + translateY/PIXELS_PER_INCH;
        info.startX = startX/PIXELS_PER_INCH + translateX/PIXELS_PER_INCH;
        info.startY = startY/PIXELS_PER_INCH + translateY/PIXELS_PER_INCH;
        info.endX = values.currentX/PIXELS_PER_INCH + translateX/PIXELS_PER_INCH;
        info.endY = values.currentY/PIXELS_PER_INCH + translateY/PIXELS_PER_INCH;
        return info;
    },

    //calculates length of line given array of x,y coordinates
    getLineLength: function(x_values, y_values){
        var length = 0;
        for(i = 1; i < x_values.length; i++){
            length += Math.sqrt(Math.pow((x_values[i]-x_values[i-1]), 2)+Math.pow((y_values[i]-y_values[i-1]), 2));
        }
        return length;
    },

    //returns manipulatable bezier curve
    getCurve: function(x_current, y_current, x_values, y_values){
        if(x_values.length === 3)
            var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1] , x_values[2],y_values[2]);
        else
            var curve = new bezier(x_current,y_current , x_values[0],y_values[0] , x_values[1],y_values[1]);
        return curve;
    },

    //compares minimum and maximum coordinates of lines for bounding box calculations
    compareLineValues: function(values){
        values.smallX = Math.min(values.smallX, values.currentX);
        values.smallY = Math.min(values.smallY, values.currentY);
        values.largeX = Math.max(values.largeX, values.currentX);
        values.largeY = Math.max(values.largeY, values.currentY);
    },

    //compares minimum and maximum coordinates of bezier curves for bounding box calculations
    compareCurveValues: function(values, args){
        values.smallX = Math.min(values.smallX, LC.getCurve.apply(null, args).bbox().x.min);
        values.smallY = Math.min(values.smallY, LC.getCurve.apply(null, args).bbox().y.min);
        values.largeX = Math.max(values.largeX, LC.getCurve.apply(null, args).bbox().x.max);
        values.largeY = Math.max(values.largeY, LC.getCurve.apply(null, args).bbox().y.max);
    },

    //compares minimum and maximum coordinates of elliptical arcs for bounding box calculations
    compareArcValues: function(values, point){
        values.smallX = Math.min(values.smallX, point.x);
        values.smallY = Math.min(values.smallY, point.y);
        values.largeX = Math.max(values.largeX, point.x);
        values.largeY = Math.max(values.largeY, point.y);
    },

    //converts units to inches
    toInches: function(string){
        if(string.indexOf('in') !== -1){
            return parseFloat(string.substring(0,string.indexOf('in')));
        }
        else if(string.indexOf('cm') !== -1){
            return parseFloat(string.substring(0,string.indexOf('cm'))) / 2.54;
        }
        else if(string.indexOf('mm') !== -1){
            return parseFloat(string.substring(0,string.indexOf('mm'))) / 25.4;
        }
        else if(string.indexOf('pt') !== -1){
            return parseFloat(string.substring(0,string.indexOf('pt'))) / 72;
        }
        else if(string.indexOf('pc') !== -1){
            return parseFloat(string.substring(0,string.indexOf('pc'))) / 6;
        }
        else{
            return parseFloat(string) / 90;
        }
    }
        
}

//console.log(LC.getFilePathLength("/test/test_files/colours.svg", 2));

//make functions available for testing
module.exports = LC;