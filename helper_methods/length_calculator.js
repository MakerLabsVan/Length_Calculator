//import required libraries
var bezier = require('bezier-js');  //from https://github.com/Pomax/bezierjs
var fs = require('fs');                     
var svgparser = require('svg-path-parser');    //from https://github.com/hughsk/svg-path-parser
var SVGCurveLib = require(__dirname + '/svg_curve_lib.js');  //from https://github.com/MadLittleMods/svg-curve-lib
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var materials_data = require(__dirname + '/../materials_data/materials_data.js');
var prompt = require('prompt');
var math = require('mathjs');

//Its not about the length or cleanliness of the code. Its about sending a message.

//command line interface using prompt.js
prompt.start();
prompt.get(['mode'], function(err, res){
    if (res.mode === 'vector'){
        prompt.get(['material', 'file', 'membership'], function(err, result){
            console.log(LC.getVectorCost(result.material, result.file, result.membership));
        });
    }
    else if (res.mode === 'raster'){
        prompt.get(['file', 'membership', 'resolution'], function(err, result){
            console.log(LC.getRasterCost(result.file, result.membership, result.resolution));
        });
    }
    else{
        console.log("Error. Please type either vector or raster to select mode.");
    }
})


var LC = {

    vis: [[],[],[],[]], //jog line visualization path data.

    //cost calculations ignores clip paths. This means that the program may take into account invisible paths.
    getVectorCost: function(material, file, membership){
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
        cost.jogCoords = LC.vis; //pass on jog coordinates to ejs view
        LC.vis = [[],[],[],[]];  //reset array
        return cost;
    },

    getRasterCost: function(file, membership, resolution){ //resolution is either 252, 512, or 1024
        var resolution = resolution || 252; //default resolution
        var ACCELERATION_TIME_PER_INCH = 0.63333; //in minutes
        var data = LC.getFilePathLength(file);
        var cost = {
            xWidth: data.xWidth,
            yLength: data.yLength,
            speed: MLV.laserSpeed.maxRasterSpeed,
            rate: MLV.cost[membership]
        };
        cost.time = cost.xWidth / MLV.laserSpeed.maxRasterSpeed;
        cost.time = cost.time * cost.yLength * resolution;
        cost.time = cost.time / 60; //convert from seconds to minutes
        cost.time += ACCELERATION_TIME_PER_INCH * cost.yLength;
        cost.money = cost.time * MLV.cost[membership];
        return cost;
    },

    //get path length of file
    getFilePathLength: function(file, passes){
        var passes = passes || 1;
        var smallX = Number.MAX_VALUE;
        var smallY = Number.MAX_VALUE;
        var largeX = -Number.MAX_VALUE;
        var largeY = -Number.MAX_VALUE;
        var startX = 0;
        var startY = 0;
        var jog = {x: 0, y: 0 };
        var map = {jogLengthX: 0, jogLengthY:0, total:0};
        var data = fs.readFileSync(__dirname + '/..' + file, 'utf8');

        while(data.indexOf('xmlns') !== -1){
            var start = data.indexOf('xmlns');
            var end = data.indexOf('\n', start);
            data = data.substring(0, start) + data.substring(end+2);
        }

        var doc = new dom().parseFromString(data);      //parse String into data structure
        var array = xpath.select('//path[@style]', doc);    //find all path nodes with style attribute
        var width = LC.toInches(xpath.select('/svg/@width', doc)[0].nodeValue);
        var height = LC.toInches(xpath.select('/svg/@height', doc)[0].nodeValue);
        var viewBox = {data: xpath.select('/svg/@viewBox', doc)[0]};
        if(viewBox.data !== undefined){
            viewBox.data = viewBox.data.nodeValue;
            viewBox.sy = viewBox.data.substring(viewBox.data.lastIndexOf(' ') + 1);
            var tempString = viewBox.data.substring(0, viewBox.data.lastIndexOf(' '));
            viewBox.sx = tempString.substring(tempString.lastIndexOf(' ') + 1);
        }

        for(var i = 0; i < array.length; i++){
            var path = xpath.select('./@style', array[i]);
            var transform = xpath.select('ancestor::*/@transform', array[i]); //group transformations
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

            var individualTransform = xpath.select('./@transform', array[i])[0]; //take into account individual path transform attributes. bugs with chaining transformations
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
            var info = LC.getLength(xpath.select('./@d', array[i])[0].nodeValue, transmat, passes);
            
            if((style.opacity === undefined || style.opacity !== '0') && info.smallX >= 0 && info.smallY >= 0 && info.largeX <= width && info.largeY <= height){ //opacity check. Out of bounds check usually screws up due to multiple translations, which is why I removed it
                if(i != 0){
                    map.jogLengthX += LC.getLineLength([jog.x, info.startX], [jog.y, jog.y]);
                    map.jogLengthY += LC.getLineLength([jog.x, jog.x], [jog.y, info.startY]);
                    LC.addJogLine(jog.x * 90, jog.y * 90, info.startX * 90, info.startY * 90);
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
        map.jogLengthY += LC.getLineLength([jog.x, jog.x], [jog.y, smallY]);
        LC.addJogLine(jog.x * 90, jog.y * 90, smallX * 90, smallY * 90);
        map.jogLengthX += LC.getLineLength([startX, smallX], [startY, startY]);
        map.jogLengthY += LC.getLineLength([startX, startX], [startY, smallY]);
        LC.addJogLine(startX * 90, startY * 90, smallX * 90, smallY * 90);
        map.xWidth = largeX - smallX;
        map.yLength = largeY - smallY;
        map.perimeter = map.xWidth * 2 + map.yLength * 2;
        return map;
    },

    //Calculates length from path data using helper methods
    getLength: function(string, transformation_matrix, passes){
        var passes = passes || 1;
        var transmat = transformation_matrix;
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
        var arrayOfCommands = svgparser(string);
        var length = 0;
        var jogLengthX = 0;
        var jogLengthY = 0;

        for(var i = 0; i < arrayOfCommands.length; i++) {
            var temp = arrayOfCommands[i];
            if(temp.x !== undefined){
                var point = LC.transform(temp.x, temp.y, transmat); //end point
            }
            if(temp.x1 !== undefined){
                var point1 = LC.transform(temp.x1, temp.y1, transmat); //control point 1
            }
            if(temp.x2 !== undefined){
                var point2 = LC.transform(temp.x2, temp.y2, transmat); //control point 2
            }
            if(temp.rx !== undefined){
                var pointr = LC.transform(temp.rx, temp.ry, transmat); //radius
            }
            switch(temp.command){
                case 'moveto':
                    if(temp.relative){
                        if(i !== 0){
                            jogLengthX += LC.getLineLength([values.currentX, values.currentX + point.x], [values.currentY, values.currentY]);
                            jogLengthY += LC.getLineLength([values.currentX, values.currentX], [values.currentY, values.currentY + point.y]);
                            LC.addJogLine(values.currentX, values.currentY, values.currentX + point.x, values.currentY + point.y);
                        }
                        else{
                            startX = point.x;
                            startY = point.y;
                        }
                        values.currentX += point.x;
                        values.currentY += point.y;
                        values.closeX += point.x;
                        values.closeY += point.y;
                        LC.compareLineValues(values);
                    }
                    else{
                        if(i !== 0){
                            jogLengthX += LC.getLineLength([values.currentX, point.x], [values.currentY, values.currentY]);
                            jogLengthY += LC.getLineLength([values.currentX, values.currentX], [values.currentY, point.y]);
                            LC.addJogLine(values.currentX, values.currentY, point.x, point.y);
                        }
                        else{
                            startX = point.x;
                            startY = point.y;
                        }
                        values.currentX = point.x;
                        values.currentY = point.y;
                        values.closeX = point.x;
                        values.closeY = point.y;
                        LC.compareLineValues(values);
                    }
                    break;

                case 'lineto':
                    if(temp.relative){
                        length += LC.getLineLength([values.currentX, values.currentX + point.x], [values.currentY, values.currentY + point.y]);
                        values.currentX += point.x;
                        values.currentY += point.y;
                        LC.compareLineValues(values);
                    }
                    else{
                        length += LC.getLineLength([values.currentX, point.x], [values.currentY, point.y]);
                        values.currentX = point.x;
                        values.currentY = point.y;
                        LC.compareLineValues(values);
                    }
                    break;

                case 'horizontal lineto':
                    if(temp.relative){
                        length += LC.getLineLength([values.currentX, values.currentX + point.x], [values.currentY, values.currentY]);
                        values.currentX += point.x;
                        LC.compareLineValues(values);
                    }
                    else{
                        length += LC.getLineLength([values.currentX, point.x], [values.currentY, values.currentY]);
                        values.currentX = point.x;
                        LC.compareLineValues(values);
                    }
                    break;

                case 'vertical lineto':
                    if(temp.relative){
                        length += LC.getLineLength([values.currentX, values.currentX], [values.currentY, values.currentY + point.y]);
                        values.currentY += point.y;
                        LC.compareLineValues(values);
                    }
                    else{
                        length += LC.getLineLength([values.currentX, values.currentX], [values.currentY, point.y]);
                        values.currentY = point.y;
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
                                values.currentX + point1.x,
                                values.currentX + point2.x,
                                values.currentX + point.x
                            ], [
                                values.currentY + point1.y,
                                values.currentY + point2.y,
                                values.currentY + point.y]
                        ];
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
                        values.smoothX = values.currentX + point2.x;
                        values.smoothY = values.currentY + point2.y;
                        values.currentX += point.x;
                        values.currentY += point.y;
                    }
                    else{
                        var args = [
                            values.currentX, 
                            values.currentY, 
                            [
                                point1.x, 
                                point2.x, 
                                point.x
                            ], [
                                point1.y, 
                                point2.y, 
                                point.y]
                        ];
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
                        values.currentX = point.x;
                        values.currentY = point.y;
                        values.smoothX = point2.x;
                        values.smoothY = point2.y;
                    }
                    break;

                case 'smooth curveto':
                    if(temp.relative){
                        var args = [
                            values.currentX,
                            values.currentY,
                            [
                                values.currentX * 2 - values.smoothX,
                                values.currentX + point2.x,
                                values.currentX + point.x
                            ], [
                                values.currentY * 2 - values.smoothY,
                                values.currentY + point2.y,
                                values.currentY + point.y
                            ]
                        ];
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
                        values.currentX += point.x;
                        values.currentY += point.y;
                    }
                    else{
                        var args = [
                            values.currentX,
                            values.currentY,
                            [
                                values.currentX * 2 - values.smoothX,
                                point2.x,
                                point.x
                            ],[
                                values.currentY * 2 - values.smoothY,
                                point2.y, point.y
                            ]
                        ];
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
                        values.currentX = point.x;
                        values.currentY = point.y;
                    }
                    break;

                case 'quadratic curveto':
                    if(temp.relative){
                        var args = [
                            values.currentX,
                            values.currentY,
                            [
                                values.currentX + point1.x,
                                values.currentX + point.x
                            ], [
                                values.currentY + point1.y,
                                values.currentY + point.y
                            ]
                        ];
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
                        values.smoothX = values.currentX + point1.x;
                        values.smoothY = values.currentY + point1.y;
                        values.currentX += point.x;
                        values.currentY += point.y;
                    }
                    else{
                        var args = [
                            values.currentX,
                            values.currentY,
                            [
                                point1.x,
                                point.x
                            ], [
                                point1.y,
                                point.y
                            ]
                        ];
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
                        values.currentX = point.x;
                        values.currentY = point.y;
                        values.smoothX = point1.x;
                        values.smoothY = point1.y;
                    }
                    break;

                case 'smooth quadratic cuveto':
                    if(temp.relative){
                        var args = [
                            values.currentX,
                            values.currentY,
                            [
                                values.currentX * 2 - values.smoothX,
                                values.currentX + point.x
                            ], [
                                values.currentY * 2 - values.smoothY,
                                values.currentY + point.y
                            ]
                        ];
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
                        values.currentX += point.x;
                        values.currentY += point.y;
                    }
                    else{
                        var args = [
                            values.currentX,
                            values.currentY,
                            [
                                values.currentX * 2 - values.smoothX,
                                point.x
                            ], [
                                values.currentY * 2 - values.smoothY,
                                point.y
                            ]
                        ];
                        length += LC.getCurve.apply(null, args).length();
                        LC.compareCurveValues(values,args);
                        values.currentX = point.x;
                        values.currentY = point.y;
                    }
                    break;

                case 'elliptical arc':
                    if(temp.relative){
                        var ellipticalArc = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                            var pointOnArc = SVGCurveLib.pointOnEllipticalArc({x: values.currentX , y: values.currentY}, pointr.x, pointr.y, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: values.currentX + point.x, y: values.currentY + point.y}, t);
                            LC.compareArcValues(values, pointOnArc);
                            return pointOnArc;
                        });
                        length += ellipticalArc.arcLength;
                        values.currentX += point.x;
                        values.currentY += point.y;
                    }
                    else{
                        var ellipticalArc = SVGCurveLib.approximateArcLengthOfCurve(10000, function(t) {
                            var pointOnArc = SVGCurveLib.pointOnEllipticalArc({x: values.currentX , y: values.currentY}, pointr.x, pointr.y, temp.xAxisRotation, temp.largeArc, temp.sweep, {x: point.x, y: point.y}, t);
                            LC.compareArcValues(values, pointOnArc);
                            return pointOnArc;
                        });
                        length += ellipticalArc.arcLength;
                        values.currentX = point.x;
                        values.currentY = point.y;
                    }
                    break;

                default:
                    console.log('Error. Unknown path command.');
            }
        }
        var info = {};
        var PIXELS_PER_INCH = 90; //dividng by 90 to convert pixels into inches
        var xOffSet = transmat.get([0,2]) / PIXELS_PER_INCH;
        var yOffSet = transmat.get([1,2]) / PIXELS_PER_INCH;

        info.length = length/PIXELS_PER_INCH * passes;
        info.jogLengthX = jogLengthX/PIXELS_PER_INCH * passes;
        info.jogLengthY = jogLengthY/PIXELS_PER_INCH * passes;
        info.jogLengthX += LC.getLineLength([values.currentX, values.closeX], [values.currentY, values.currentY]) * (passes - 1) / PIXELS_PER_INCH;
        info.jogLengthY += LC.getLineLength([values.currentX, values.currentX], [values.currentY, values.closeY]) * (passes - 1) / PIXELS_PER_INCH;
        LC.addJogLine(values.currentX, values.currentY, values.closeX, values.closeY);
        info.smallX = values.smallX/PIXELS_PER_INCH + xOffSet;
        info.smallY = values.smallY/PIXELS_PER_INCH + yOffSet;
        info.largeX = values.largeX/PIXELS_PER_INCH + xOffSet;
        info.largeY = values.largeY/PIXELS_PER_INCH + yOffSet;
        info.startX = startX/PIXELS_PER_INCH + xOffSet;
        info.startY = startY/PIXELS_PER_INCH + yOffSet;
        info.endX = values.currentX/PIXELS_PER_INCH + xOffSet;
        info.endY = values.currentY/PIXELS_PER_INCH + yOffSet;
        return info;
    },

    //transforms coordinates with transformation matrix
    transform: function(x, y, transformation_matrix){
        var scaleX = transformation_matrix.get([0,0]);
        var scaleY = transformation_matrix.get([1,1]);
        var point = {x: x * scaleX, y: y * scaleY};
        return point;
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
    },

    //adds jogging lines to visualization
    addJogLine: function(x1, y1, x2, y2){
        LC.vis[0].push(x1);
        LC.vis[1].push(y1);
        LC.vis[2].push(x2);
        LC.vis[3].push(y2);
    }
        
}

//console.log(LC.getVectorCost('paper', '/test/test_files/1.svg', 'diyMember'));

//make functions available for testing
module.exports = LC;