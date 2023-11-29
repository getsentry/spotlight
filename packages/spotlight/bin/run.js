#!/usr/bin/env node
const { setupSidecar } = await import('../dist/sidecar.js');
setupSidecar();
