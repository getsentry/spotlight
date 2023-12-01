#!/usr/bin/env node
const { setupSidecar } = await import('./dist/main.js');
const port = process.argv[2];
setupSidecar(port);
