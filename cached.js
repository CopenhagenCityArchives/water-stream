'use strict';

const streamBuffers = require('stream-buffers');
const NodeCache = require('node-cache');
const Writable = require('stream').Writable;

let cache;

module.exports = (key, res, missCallback) => {
  var stream = new streamBuffers.ReadableStreamBuffer();

  var cachedBuffer = cache.get(key);
  if(cachedBuffer) {
    stream.pipe(res);
    stream.put(cachedBuffer);
    stream.stop();
  } else {
    var data = [];
    var writableStream = new Writable({
      write(chunk, encoding, callback) {
        stream.put(chunk);
        callback();
        data.push(chunk);
      }
    });
    writableStream.on('finish', () => {
      stream.pipe(res);
      stream.stop();
      cache.set(key, Buffer.concat(data));
    });
    missCallback(writableStream);
  }
};

module.exports.config = (options) => {
  cache = new NodeCache(options);
};
// Start by configuring without any options
module.exports.config();
