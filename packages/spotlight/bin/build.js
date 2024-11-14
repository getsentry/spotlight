#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inject } from 'postject';

const DIST_DIR = './dist';
const ASSETS_DIR = join(DIST_DIR, 'overlay');
const MANIFEST_NAME = 'manifest.json';
const MANIFEST_PATH = join(ASSETS_DIR, MANIFEST_NAME);
const ENTRY_POINT_NAME = 'src/index.html';
const SEA_CONFIG_PATH = join(DIST_DIR, 'sea-config.json');
const SPOTLIGHT_BLOB_PATH = join(DIST_DIR, 'spotlight.blob');
const SPOTLIGHT_BIN_PATH = join(DIST_DIR, 'spotlight');
const manifest = JSON.parse(readFileSync(MANIFEST_PATH));
const seaConfig = {
  main: join(DIST_DIR, 'spotlight.cjs'),
  output: SPOTLIGHT_BLOB_PATH,
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: false,
  assets: {
    [MANIFEST_NAME]: MANIFEST_PATH,
    [ENTRY_POINT_NAME]: join(ASSETS_DIR, ENTRY_POINT_NAME),
    ...Object.fromEntries(Object.values(manifest).map(entry => [entry.file, join(ASSETS_DIR, entry.file)])),
  },
};
writeFileSync(SEA_CONFIG_PATH, JSON.stringify(seaConfig));
spawnSync(process.execPath, ['--experimental-sea-config', SEA_CONFIG_PATH], { stdio: 'inherit' });
console.log(`Copying node executable from ${process.execPath} to ${SPOTLIGHT_BIN_PATH}`);
copyFileSync(process.execPath, SPOTLIGHT_BIN_PATH);
if (process.platform == 'darwin') {
  console.log('Detected MacOS, removing signature from node executable first');
  spawnSync('codesign', ['--remove-signature', SPOTLIGHT_BIN_PATH], { stdio: 'inherit' });
}
await inject(SPOTLIGHT_BIN_PATH, 'NODE_SEA_BLOB', readFileSync(SPOTLIGHT_BLOB_PATH), {
  sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
});
if (process.platform == 'darwin') {
  console.log('Signing the generated executable...');
  spawnSync('codesign', ['--force', '-s', process.env.APPLE_TEAM_ID, SPOTLIGHT_BIN_PATH], { stdio: 'inherit' });
  console.log('Verifying signature...');
  spawnSync('codesign', ['-v', SPOTLIGHT_BIN_PATH, '--verbose'], { stdio: 'inherit' });
  console.log('Signature verified.');
}
