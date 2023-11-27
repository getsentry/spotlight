#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');

// Directory where the script is running
const directoryPath = path.join(__dirname);

// Function to read files and send data
function sendData(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}: ${err}`);
      return;
    }

    const headers = {
      'Content-Type': 'application/x-sentry-envelope',
    };

    if (process.env.GZIP === '1') {
      headers['Content-Encoding'] = 'gzip';
    }

    const options = {
      hostname: 'localhost',
      port: 8969,
      path: '/stream',
      method: 'POST',
      headers: headers,
    };

    const req = http.request(options, res => {
      console.log(`Status: ${res.statusCode}`);
    });

    req.on('error', error => {
      console.error(`Problem with request: ${error.message}`);
    });

    // Check if GZIP environment variable is set to 1
    if (process.env.GZIP === '1') {
      zlib.gzip(data, (_error, compressedData) => {
        // Send the compressed data
        req.write(compressedData);
        req.end();
      });
    } else {
      // Send the data without compression
      req.write(data);
      req.end();
    }
  });
}

// Read all .txt files from the directory
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.log('Unable to scan directory: ' + err);
    return;
  }

  files.forEach(file => {
    if (path.extname(file) === '.txt') {
      sendData(path.join(directoryPath, file));
    }
  });
});
