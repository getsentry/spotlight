#!/usr/bin/env node
const { setupSidecar } = await import('../dist/sidecar.js');
const port = process.argv[2];
setupSidecar({ port, basePath: process.cwd() });
