#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const path = require('path');

// Directory where the script is running
const directoryPath = path.join(__dirname);

// Function to read files and send data
function sendData(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}: ${err}`);
      return;
    }

    const options = {
      hostname: 'localhost',
      port: 8969,
      path: '/stream',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    };

    const req = http.request(options, res => {
      console.log(`Status: ${res.statusCode}`);
    });

    req.on('error', error => {
      console.error(`Problem with request: ${error.message}`);
    });

    // Send the data
    req.write(data);
    req.end();
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
