#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { copyFileSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inject } from 'postject';
import assert from 'node:assert';

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
  useCodeCache: true,
  assets: {
    [MANIFEST_NAME]: MANIFEST_PATH,
    [ENTRY_POINT_NAME]: join(ASSETS_DIR, ENTRY_POINT_NAME),
    ...Object.fromEntries(Object.values(manifest).map(entry => [entry.file, join(ASSETS_DIR, entry.file)])),
  },
};

function run(cmd, ...args) {
  const output = execFileSync(cmd, args, { encoding: 'utf8' });
  console.log(output);
  return output;
}

function sign(path) {
  console.log(`Signing ${path}...`);
  // Command yanked from https://github.com/nodejs/node/blob/main/tools/osx-codesign.sh
  return run(
    'codesign',
    '-s',
    process.env.APPLE_TEAM_ID,
    '--timestamp',
    '--options',
    'runtime',
    '--entitlements',
    join(import.meta.dirname, 'entitlements.plist'),
    path,
  );
}

writeFileSync(SEA_CONFIG_PATH, JSON.stringify(seaConfig));
run(process.execPath, '--experimental-sea-config', SEA_CONFIG_PATH);
console.log(`Copying node executable from ${process.execPath} to ${SPOTLIGHT_BIN_PATH}`);
copyFileSync(process.execPath, SPOTLIGHT_BIN_PATH);
if (process.platform === 'darwin') {
  console.log('Detected MacOS, removing signature from node executable first');
  run('codesign', '--remove-signature', SPOTLIGHT_BIN_PATH);
}
console.log('Injecting spotlight blob into node executable...');
await inject(SPOTLIGHT_BIN_PATH, 'NODE_SEA_BLOB', readFileSync(SPOTLIGHT_BLOB_PATH), {
  sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  machoSegmentName: process.platform === 'darwin' ? 'NODE_SEA' : undefined,
});
console.log('Created executable.');
run('chmod', '+x', SPOTLIGHT_BIN_PATH);
if (process.platform === 'darwin') {
  sign(SPOTLIGHT_BIN_PATH);
  const zip_path = `${SPOTLIGHT_BIN_PATH}.zip`;
  run('ditto', '-c', '-k', '--sequesterRsrc', '--keepParent', SPOTLIGHT_BIN_PATH, zip_path);
  sign(zip_path);
  console.log('Notarizing...');
  const notarization_id = JSON.parse(
    run(
      'xcrun',
      'notarytool',
      'submit',
      zip_path,
      '--apple-id',
      process.env.APPLE_ID,
      '--password',
      process.env.APPLE_ID_PASS,
      '--team-id',
      process.env.APPLE_TEAM_ID,
      '--no-progress',
      '-f',
      'json',
      '--wait',
    ),
  ).id;
  const notarization_logs = JSON.parse(
    run(
      'xcrun',
      'notarytool',
      'log',
      '--apple-id',
      process.env.APPLE_ID,
      '--password',
      process.env.APPLE_ID_PASS,
      '--team-id',
      process.env.APPLE_TEAM_ID,
      notarization_id,
    ),
  );
  assert(notarization_logs.status === 'Accepted', `Notarization failed: \n${JSON.stringify(notarization_logs)}`);
  console.log('Verifying notarization...');
  run(
    'xcrun',
    'spctl',
    '--assess',
    '--context',
    'context:primary-signature',
    '--ignore-cache',
    '--verbose=2',
    zip_path,
  );
  console.log('Notarization verified.');
  console.log('Stapling...');
  run('xcrun', 'stapler', 'staple', zip_path);
  console.log('Stapled');
  unlinkSync(SPOTLIGHT_BIN_PATH);
  run('ditto', '-xk', zip_path, '.');
}
