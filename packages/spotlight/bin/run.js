#!/usr/bin/env node
const { setupSidecar } = await import('../dist/sidecar.js');
const port = process.argv.length >= 3 ? Number(process.argv[2]) : undefined;
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
setupSidecar({ port, basePath: join(fileURLToPath(import.meta.url), '../../dist/overlay/') });
