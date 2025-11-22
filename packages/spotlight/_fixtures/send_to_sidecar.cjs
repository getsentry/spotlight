#!/usr/bin/env node
const fs = require('node:fs').promises;
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');
const { promisify, parseArgs } = require('node:util');

const gzipAsync = promisify(zlib.gzip);
const brotliCompressAsync = promisify(zlib.brotliCompress);

// Parse CLI arguments using Node.js built-in parseArgs
function parseCLIArgs() {
  const { values, positionals } = parseArgs({
    options: {
      'keep-alive': {
        type: 'boolean',
        short: 'k',
        default: false,
      },
      compression: {
        type: 'string',
        short: 'c',
        default: 'gzip',
      },
    },
    allowPositionals: true,
    strict: false,
  });

  return {
    keepAlive: values['keep-alive'],
    compression: values.compression,
    target: positionals[0],
  };
}

// Parse SENTRY_SPOTLIGHT environment variable to extract URL components
function parseSentrySpotlight() {
  const sentrySpotlight = process.env.SENTRY_SPOTLIGHT;
  
  if (!sentrySpotlight) {
    // Default to localhost:8969/stream
    return {
      hostname: 'localhost',
      port: 8969,
      path: '/stream',
    };
  }

  // Handle truthy values (1, true, yes, etc.)
  const truthyValues = ['1', 'true', 'yes', 'on', 'enabled'];
  if (truthyValues.includes(sentrySpotlight.toLowerCase())) {
    return {
      hostname: 'localhost',
      port: 8969,
      path: '/stream',
    };
  }

  // Parse full URL
  try {
    const url = new URL(sentrySpotlight);
    return {
      hostname: url.hostname,
      port: parseInt(url.port) || 8969,
      path: url.pathname,
    };
  } catch (err) {
    console.error(`Invalid SENTRY_SPOTLIGHT URL: ${sentrySpotlight}, using defaults`);
    return {
      hostname: 'localhost',
      port: 8969,
      path: '/stream',
    };
  }
}

// Compress data based on compression type
async function compressData(data, compressionType) {
  switch (compressionType) {
    case 'gzip':
      return await gzipAsync(data);
    case 'br':
    case 'brotli':
      return await brotliCompressAsync(data);
    case 'zstd':
      // Node.js v22+ supports zstd
      if (typeof zlib.zstdCompress === 'function') {
        const zstdCompressAsync = promisify(zlib.zstdCompress);
        return await zstdCompressAsync(data);
      } else {
        console.warn('zstd compression not available in this Node.js version, falling back to gzip');
        return await gzipAsync(data);
      }
    case 'none':
      return data;
    default:
      console.warn(`Unknown compression type: ${compressionType}, using gzip`);
      return await gzipAsync(data);
  }
}

// Get Content-Encoding header based on compression type
function getContentEncoding(compressionType) {
  switch (compressionType) {
    case 'gzip':
      return 'gzip';
    case 'br':
    case 'brotli':
      return 'br';
    case 'zstd':
      return 'zstd';
    case 'none':
      return null;
    default:
      return 'gzip';
  }
}

// Function to read files and send data
async function sendData(filePath, targetUrl, compressionType) {
  let data;
  try {
    data = await fs.readFile(filePath);
  } catch (err) {
    console.error(`Error reading file ${filePath}: ${err}`);
    return;
  }
  console.log(`[${filePath}] size: ${data.length}`);

  const headers = {
    'Content-Type': 'application/x-sentry-envelope',
  };

  // Compress data if needed
  let compressedData = data;
  if (compressionType !== 'none') {
    try {
      compressedData = await compressData(data, compressionType);
      const contentEncoding = getContentEncoding(compressionType);
      if (contentEncoding) {
        headers['Content-Encoding'] = contentEncoding;
      }
      console.log(`[${filePath}] compressed size: ${compressedData.length} (${compressionType})`);
    } catch (err) {
      console.error(`Error compressing data: ${err}`);
      compressedData = data;
    }
  }

  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: targetUrl.path,
    method: 'POST',
    headers: headers,
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      console.log(`[${filePath}] Status: ${res.statusCode}`);
      res.on('data', () => {}); // Consume response data
      res.on('end', () => resolve());
    });

    req.on('error', error => {
      console.error(`Problem with request: ${error.message}`);
      reject(error);
    });

    req.write(compressedData);
    req.end();
  });
}

async function readDir(directoryPath, targetUrl, compressionType) {
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
      await readDir(entryPath, targetUrl, compressionType);
    } else if (entry.isFile() && (entry.name.endsWith('.txt') || entry.name.endsWith('.bin'))) {
      await sendData(entryPath, targetUrl, compressionType);
    }
  }
}

async function main() {
  const args = parseCLIArgs();
  const targetUrl = parseSentrySpotlight();
  
  console.log(`Target: ${targetUrl.hostname}:${targetUrl.port}${targetUrl.path}`);
  console.log(`Compression: ${args.compression}`);
  console.log(`Keep-alive: ${args.keepAlive}`);

  const target = args.target || __dirname;
  
  try {
    const stats = await fs.stat(target);
    if (stats.isFile()) {
      await sendData(target, targetUrl, args.compression);
    } else if (stats.isDirectory()) {
      await readDir(target, targetUrl, args.compression);
    }
  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
  }

  if (args.keepAlive) {
    console.log('Keep-alive mode: waiting for termination signal...');
    
    // Set up signal handlers for graceful shutdown
    const shutdown = () => {
      console.log('Received termination signal, exiting...');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Keep the process alive
    await new Promise(() => {}); // Never resolves, waits for signal
  }
}

main();
