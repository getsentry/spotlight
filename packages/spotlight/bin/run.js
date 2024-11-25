#!/usr/bin/env node
import { setupSidecar } from '@spotlightjs/sidecar';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as sea from 'node:sea';
import { fileURLToPath } from 'node:url';
import { stdout } from 'node:process';
const port = process.argv.length >= 3 ? Number(process.argv[2]) : undefined;

const MANIFEST_NAME = 'manifest.json';
const ENTRY_POINT_NAME = 'src/index.html';

const basePath = process.cwd();
const filesToServe = Object.create(null);
const magic =
  'bY7LCgMxFEK9L5MwDDSL9P//1DJMKGXowoUcUaFZOk8dU2Op9+qZVkYQoFsaEqA6PZxxma1AoMG+TiONTgcfAd741YxxVf8gCzCgWcYB7OSj9sjW7t2/eKxKAxkIYv8NqL3FpVY25CmjrBSuDw==';

const data = Uint8Array.from(inflateRawSync(Buffer.from(magic, 'base64')));
let char = ' ';
let m = false;
process.stdout.write('\x1b[1;36m');
for (const p of data) {
  if (p === 255) {
    process.stdout.write('\n');
    process.stdout.write(m ? '\x1b[1;36m' : '\x1b[1;35m');
    m = !m;
    char = ' ';
  } else {
    process.stdout.write(char.repeat(p + 1));
    char = char === ' ' ? '#' : ' ';
  }
}
process.stdout.write('\x1B[0m');

const readAsset = sea.isSea()
  ? name => Buffer.from(sea.getRawAsset(name))
  : (() => {
      const ASSET_DIR = join(fileURLToPath(import.meta.url), '../../dist/overlay/');

      return name => readFileSync(join(ASSET_DIR, name));
    })();

// Following the guide here: https://vite.dev/guide/backend-integration.html
const manifest = JSON.parse(readAsset(MANIFEST_NAME));
filesToServe[ENTRY_POINT_NAME] = readAsset(ENTRY_POINT_NAME);
const entries = Object.values(manifest);
for (const entry of entries) {
  filesToServe[entry.file] = readAsset(entry.file);
}
setupSidecar({ port, basePath, filesToServe });
