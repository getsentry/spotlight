#!/usr/bin/env node
import { setupSidecar } from '@spotlightjs/sidecar';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as sea from 'node:sea';
import { fileURLToPath } from 'node:url';
const port = process.argv.length >= 3 ? Number(process.argv[2]) : undefined;

const MANIFEST_NAME = 'manifest.json';
const ENTRY_POINT_NAME = 'src/index.html';

const basePath = process.cwd();
const filesToServe = Object.create(null);

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
