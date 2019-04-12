'use strict';

var Canvas = require('canvas');
var Image = Canvas.Image;
const Transform = require('stream').Transform;

const WATERMARK_SCALE = 0.33; // 33% of the width of the thumbnail

function bottomRightPosition(img, watermarkImg, scale = WATERMARK_SCALE) {
  var watermarkRatio = watermarkImg.height / watermarkImg.width;

  var watermarkWidth = img.width * scale;
  var watermarkHeight = watermarkWidth * watermarkRatio;

  return {
    left: img.width - watermarkWidth,
    top: img.height - watermarkHeight,
    width: watermarkWidth,
    height: watermarkHeight
  };
}

module.exports.bottomRightPosition = bottomRightPosition;

function middleCenterPosition(img, watermarkImg, scale = WATERMARK_SCALE) {
  var watermarkRatio = watermarkImg.height / watermarkImg.width;

  var watermarkWidth = img.width * scale;
  var watermarkHeight = watermarkWidth * watermarkRatio;

  return {
    left: img.width/2 - watermarkWidth / 2,
    top: img.height/2 - watermarkHeight / 2,
    width: watermarkWidth,
    height: watermarkHeight
  };
}

module.exports.middleCenterPosition = middleCenterPosition;

function transformation(watermarkBuffer, maxSize, positionFunction, scale) {
  if(positionFunction && typeof(positionFunction) !== 'function') {
    throw new Error('Expected third argument (positionFunction) to be a function');
  } else if(!positionFunction) {
    positionFunction = bottomRightPosition;
  }
  if(typeof(maxSize) !== 'number') {
    maxSize = Number.MAX_VALUE;
  } else if(maxSize <= 0) {
    throw new Error('maxSize must be a positive integer');
  }
  var imageData = [];
  return new Transform({
    transform(chunk, encoding, callback) {
      imageData.push(chunk);
      callback();
    },
    flush: function(callback) {
      var img = new Image;
      img.src = Buffer.concat(imageData);

      // Cap the maxSize at the largest of the width and height to avoid
      // stretching beyound the original image
      maxSize = Math.min(maxSize, Math.max(img.width, img.height));

      var ratio = img.width / img.height;
      var newSize = {
        width: ratio >= 1 ? maxSize : maxSize * ratio,
        height: ratio < 1 ? maxSize : maxSize / ratio,
      };

      var canvas = new Canvas(newSize.width, newSize.height);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, newSize.width, newSize.height);

      // If both a watermark buffer and position is defined, we can draw it
      if(watermarkBuffer && positionFunction) {
        var watermarkImg = new Image;
        watermarkImg.src = watermarkBuffer;
        var position = positionFunction(newSize, watermarkImg, scale);
        // Draw the watermark in the
        ctx.drawImage(watermarkImg,
                      position.left,
                      position.top,
                      position.width,
                      position.height);
      }

      // Size of the jpeg stream is just ~ 15% of the raw PNG buffer
      canvas.jpegStream({
        progressive: true
      })
      .on('data', (chuck) => {
        this.push(chuck);
      })
      .on('end', () => {
        callback();
      });
    }
  });
}

module.exports.transformation = transformation;
module.exports.cached = require('./cached.js');
