#!/usr/bin/env node
const fs = require('node:fs').promises;
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');

// Function to read files and send data
async function sendData(filePath) {
  let data;
  try {
    data = await fs.readFile(filePath);
  } catch (err) {
    console.error(`Error reading file ${filePath}: ${err}`);
    return;
  }
  console.log(`[ ${filePath}] size: ${data.length}`);

  const headers = {
    'Content-Type': 'application/x-sentry-envelope',
  };

  if (process.env.GZIP === '1') {
    headers['Content-Encoding'] = 'gzip';
  }

  const options = {
    hostname: 'localhost',
    port: process.env.PORT_NUMBER || 8969,
    path: '/stream',
    method: 'POST',
    headers: headers,
  };

  const req = http.request(options, res => {
    console.log(`[${filePath}] Status: ${res.statusCode}`);
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
}

async function readDir(directoryPath) {
  console.log(`Reading directory: ${directoryPath}`);
  let entries;
  try {
    entries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch (err) {
    console.log(`Unable to scan directory: ${err}`);
    return;
  }

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      readDir(entryPath); // Recursive call to readDir for directories
    } else if (entry.isFile() && (entry.name.endsWith('.txt') || entry.name.endsWith('.bin'))) {
      sendData(entryPath);
    }
  }
}

async function main() {
  const arg = process.argv[2] || __dirname;
  const stats = await fs.stat(arg);
  if (stats.isFile()) {
    sendData(arg);
  } else if (stats.isDirectory()) {
    readDir(arg);
  }
}

main();
