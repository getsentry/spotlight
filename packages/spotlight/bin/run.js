#!/usr/bin/env node
import { setupSidecar } from '@spotlightjs/sidecar';
import { inflateRawSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as sea from 'node:sea';
import { fileURLToPath } from 'node:url';

const magic =
  'bY7LCgMxFEK9L5MwDDSL9P//1DJMKGXowoUcUaFZOk8dU2Op9+qZVkYQoFsaEqA6PZxxma1AoMG+TiONTgcfAd741YxxVf8gCzCgWcYB7OSj9sjW7t2/eKxKAxkIYv8NqL3FpVY25CmjrBSuDw==';

const data = Uint8Array.from(inflateRawSync(Buffer.from(magic, 'base64')));
const colors = ['\x1b[38;5;56m', '\x1b[38;5;54m'];
const chars = [' ', 'S'];
let code = 0;
process.stdout.write('\x1b[1m'); // embolden
for (let p of data) {
  if (p === 255) {
    process.stdout.write('\n');
    code &= 2;
  } else {
    while (p-- >= 0) {
      process.stdout.write(colors[(code & 2) >> 1] + chars[code & 1]);
      code ^= 2;
    }
    code ^= 1;
  }
}
process.stdout.write('\x1B[0m\n');

const readAsset = sea.isSea()
  ? name => Buffer.from(sea.getRawAsset(name))
  : (() => {
      const ASSET_DIR = join(fileURLToPath(import.meta.url), '../../dist/overlay/');

      return name => readFileSync(join(ASSET_DIR, name));
    })();

const port = process.argv.length >= 3 ? Number(process.argv[2]) : undefined;
const MANIFEST_NAME = 'manifest.json';
const ENTRY_POINT_NAME = 'src/index.html';
const basePath = process.cwd();
const filesToServe = Object.create(null);

    // Following the guide here: https://vite.dev/guide/backend-integration.html
const manifest = JSON.parse(readAsset(MANIFEST_NAME));
filesToServe[ENTRY_POINT_NAME] = readAsset(ENTRY_POINT_NAME);
const entries = Object.values(manifest);
for (const entry of entries) {
  filesToServe[entry.file] = readAsset(entry.file);
}
setupSidecar({ port, basePath, filesToServe });
