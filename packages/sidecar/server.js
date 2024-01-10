#!/usr/bin/env node
const { setupSidecar } = await import('./dist/main.js');
const port = process.argv.length >= 3 ? Number(process.argv[2]) : undefined;
setupSidecar({ port });
