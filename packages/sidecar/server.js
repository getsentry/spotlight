#!/usr/bin/env node
const { setupSidecar } = await import('./dist/main.js');
setupSidecar();
