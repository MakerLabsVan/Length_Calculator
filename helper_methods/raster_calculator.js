var ML = {};

ML.drawCanvas = function(img){ //returns data object containing rasterLength & verticalDistance
  var canvas = $("#rasterCanvas");
  canvas.attr({
    width: img.width,
    height: img.height
  })
  var ctx = canvas[0].getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  return ML.drawRasterImage(canvas[0], ctx);
};

ML.updateInfo = function(r_length, v_distance, time, cost){
  $("#rasterLength").text('Optimized raster length: ' + r_length.toFixed(2) + ' inches');
  $("#rasterTime").text('Actual time: ' + time.toFixed(2) + ' minutes');
  $("#verticalDistance").text('Vertical distance: ' + v_distance + ' pixels');
  $("#rasterCost").text('Cost: $' + cost.toFixed(2));
};

ML.countRasterLength = function(r_length, v_distance, res, speed, rate){
  var ACCELERATION_TIME_CONSTANT = 0.00275; //Extra time taken per pass to deccelerate and accelerate motor; in minutes
  var rasterLength = r_length;
  var verticalDistance = v_distance;
  rasterLength = (rasterLength / 90) * (res / 90); //90 is for 90ppi; resolution / 90 is the resolution multiplication factor. Each pass of raster is not necessarily a pixel.
  var time = rasterLength / speed / 60; // 60 is conversion from inches/second to inches/minute
  time += ((verticalDistance / 90) * res) * ACCELERATION_TIME_CONSTANT; //90 is for 90ppi;
  var cost = time * rate;
  if (cost < 15){
    cost = 15;
  }
  ML.updateInfo(rasterLength, verticalDistance, time, cost);
};

ML.drawRasterImage = function(canvas, ctx){
  ML.width = canvas.width;
  ML.height = canvas.height;
  ML.data = ctx.getImageData(0, 0, ML.width, ML.height).data;
  var verticalDistance = 0;
  var rasterLength = 0;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  for(var y = 0; y < ML.height; y++){
    var leftMostPixel = ML.width - 1;
    var rightMostPixel = 0;
    for(var x = 0; x < ML.width; x++){
      if(ML.isColoured(x, y)){
        leftMostPixel = Math.min(x, leftMostPixel);
        rightMostPixel = Math.max(x, rightMostPixel);
      }
    }
    if (rightMostPixel > leftMostPixel){
      rasterLength += rightMostPixel - leftMostPixel + 1; // +1 fixes fence post problem
      ctx.moveTo(leftMostPixel,y);
      ctx.lineTo(rightMostPixel,y);
      verticalDistance++;
    }
  }
  ctx.stroke();
  var data = {r_length: rasterLength, v_distance: verticalDistance};
  return data;
};

ML.isColoured = function(x, y){
  var offset = y * 4 * ML.width + x * 4;
  var red = ML.data[offset];
  var green = ML.data[offset + 1];
  var blue = ML.data[offset + 2];
  var alpha = ML.data[offset + 3];
  if((red === 255 && green === 255 && blue === 255) || alpha === 0){
    return false;
  }
  else{
    return true;
  }
};