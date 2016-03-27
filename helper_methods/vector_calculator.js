//previously node modules, replaced with js libraries:
// var SVGCurveLib = require(__dirname + '/svg_curve_lib.js');
// var materials_data = require(__dirname + '/../materials_data/materials_data.js');

//!find replacement js for this node module
var svgparser = require('svg-path-parser');
var math = require('mathjs');
var bezier = require('bezier-js'); 

//Its not about the length or cleanliness of the code. Its about sending a message.

var LC = {

    vis: [[],[],[],[]], //jog line visualization path data.

    //cost calculations ignores clip paths. This means that the program may take into account invisible paths.

    //Returns result object containing information
    getVectorCost: function(material, bundledData, membership){
        var data = LC.getFilePathLength(bundledData, MLV.materials[material].passes);
        var result = {
            pathLength: data.total,     //calculates costs of all colours for now
            jogLengthX: data.jogLengthX,
            jogLengthY: data.jogLengthY
        };
        result.time = result.pathLength / (MLV.laserSpeed.maxCutSpeed * MLV.materials[material].speed / 100);
        result.time += result.jogLengthX / MLV.laserSpeed.maxJogSpeedX;
        result.time += result.jogLengthY / MLV.laserSpeed.maxJogSpeedY;
        result.time = result.time / 60; //convert from seconds to minutes
        result.money = result.time * MLV.cost[membership];
        result.jogCoords = LC.vis; //pass on jog coordinates to ejs view
        LC.vis = [[],[],[],[]];  //reset array
        return result;
    },

    //get path length of file
    getFilePathLength: function(bundledData, numOfPasses){
        var passes = numOfPasses || 1;
        var smallX = Number.MAX_VALUE;
        var smallY = Number.MAX_VALUE;
        var largeX = -Number.MAX_VALUE;
        var largeY = -Number.MAX_VALUE;
        var startX = 0;
        var startY = 0;
        var jog = {x: 0, y: 0 };
        var map = {jogLengthX: 0, jogLengthY:0, total:0};
        var packagedData = bundledData;
        for(var i = 0; i < packagedData.length; i++){
            var info = LC.getLength(packagedData[i].getLengthInfo.dataString, packagedData[i].getLengthInfo.transformMatrix, passes);
            if(packagedData.styleData !== undefined){
                var style = packagedData[i].styleData;
                var colour = packagedData[i].colourOfPath;
            }  
            else{
                var style = "opacity:1;fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1";
                var colour = "#000000";
            } 
            if((style.opacity === undefined || style.opacity !== '0') && info.smallX >= 0 && info.smallY >= 0){
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
                    smallX = Math.min(smallX, info.smallX); //finding top left corner of image
                    smallY = Math.min(smallY, info.smallY);
                    largeX = Math.max(largeX, info.largeX);
                    largeY = Math.max(largeY, info.largeY);
                }
                else{
                    map.total += info.length;
                    map.jogLengthX += info.jogLengthX;
                    map.jogLengthY += info.jogLengthY;
                    smallX = Math.min(smallX, info.smallX); //finding top left corner of image
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
        var arrayOfCommands = svgparser(string); // !find js replacement for svgparser node module
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
        var xOffSet = transmat.data[0][2] / PIXELS_PER_INCH;
        var yOffSet = transmat.data[1][2] / PIXELS_PER_INCH;

        info.length = length/PIXELS_PER_INCH * passes;
        info.jogLengthX = jogLengthX/PIXELS_PER_INCH * passes;
        info.jogLengthY = jogLengthY/PIXELS_PER_INCH * passes;
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
        var scaleX = transformation_matrix.data[0][0];
        var scaleY = transformation_matrix.data[1][1];
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

//make functions available for testing
module.exports = LC;