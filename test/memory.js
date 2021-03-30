// const heapdump = require('heapdump');
const http = require('http');
const fs = require('fs');
const path = require('path');
const waterStream = require('../transformation');

const watermarkPath = path.join(__dirname, 'watermarks', 'creek-500.png');
const watermarkBuffer = fs.readFileSync(watermarkPath);

const server = http.createServer((req, res) => {
  http.get('http://placekitten.com/g/600/600', (catRes) => {
    let transformation = waterStream.transformation(watermarkBuffer);
    catRes.pipe(transformation).pipe(res);
  });
}).listen(1337);
