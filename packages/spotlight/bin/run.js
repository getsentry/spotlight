#!/usr/bin/env node
const { setupSidecar } = await import('../dist/sidecar.js');
const port = process.argv[2];
import { join } from 'path';
import { fileURLToPath } from 'url';
setupSidecar({ port, basePath: join(fileURLToPath(import.meta.url), '../../dist/overlay/') });
