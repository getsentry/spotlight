#!/usr/bin/env node
import { setupSidecar } from './src/main.js';

const port = process.argv.length >= 3 ? Number(process.argv[2]) : undefined;
setupSidecar({ port, isStandalone: true });
