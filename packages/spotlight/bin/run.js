#!/usr/bin/env node
import { setupSidecar } from '@spotlightjs/sidecar';
import { inflateRawSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as sea from 'node:sea';
import { fileURLToPath } from 'node:url';

const data = Uint8Array.from(
  inflateRawSync(
    Buffer.from(
      'bY7LCgMxFEK9L5MwDDSL9P//1DJMKGXowoUcUaFZOk8dU2Op9+qZVkYQoFsaEqA6PZxxma1AoMG+TiONTgcfAd741YxxVf8gCzCgWcYB7OSj9sjW7t2/eKxKAxkIYv8NqL3FpVY25CmjrBSuDw==',
      'base64',
    ),
  ),
);
const M_COL = '\x1b[38;5;96m';
const F_COL = '\x1b[38;5;61m';
const CHARS = [' ', 'S'];
const BOLD = '\x1B[1m';
const RESET = '\x1B[0m';
const NL = `${RESET}\n`;
let factor = 0.1;
let code = 0;
let col = 0;
let line = 0;
let lim = 23;
let r = 0;
for (let p of data) {
  if (p === 255) {
    process.stdout.write(NL);
    code &= 2;
    col = 0;
    if (line++ === 8) {
      factor = -factor;
    }
    lim = Math.round(lim * (1 + factor));
    r = Math.round(Math.random() * 10);
  } else {
    while (p-- >= 0) {
      if (col < lim - 1) {
        process.stdout.write(M_COL);
      } else if (col === lim - 1) {
        process.stdout.write(F_COL);
      } else if (col === lim + r) {
        process.stdout.write(`${RESET}${BOLD}`);
      }
      process.stdout.write(CHARS[code & 1]);
      col++;
    }
    code ^= 1;
  }
}
process.stdout.write(NL);

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
