'use strict';

const streamBuffers = require('stream-buffers');
const NodeCache = require('node-cache');
const cache = new NodeCache();
const Writable = require('stream').Writable;

module.exports = (key, res, missCallback) => {
  var stream = new streamBuffers.ReadableStreamBuffer();

  var cachedBuffer = cache.get(key);
  if(cachedBuffer) {
    console.log('Hit!', key);
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
