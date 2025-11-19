import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  spawnSpotlight,
  waitForOutput,
  sendEnvelope,
  killGracefully,
  waitForSidecarReady,
} from './helpers';
import { findFreePort, getFixturePath, ensureSpotlightBuilt } from '../shared/utils';
import type { SpawnResult } from '../shared/utils';

describe('spotlight run e2e tests', () => {
  const activeProcesses: SpawnResult[] = [];
  const tempFiles: string[] = [];

  beforeAll(async () => {
    await ensureSpotlightBuilt();
  });

  afterEach(async () => {
    // Clean up all spawned processes
    for (const proc of activeProcesses) {
      if (proc.process.pid && !proc.process.killed) {
        await killGracefully(proc.process).catch(() => {
          // Force kill if graceful shutdown fails
          proc.process.kill('SIGKILL');
        });
      }
    }
    activeProcesses.length = 0;

    // Clean up temp files
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore errors
      }
    }
    tempFiles.length = 0;
  });

  it('should run simple command', async () => {
    const run = spawnSpotlight(['run', 'node', '-e', 'console.log("test")']);
    activeProcesses.push(run);

    // Wait for command output or completion
    await waitForOutput(run, /test|exited/, 5000, 'stderr');

    // Command should complete
    await run.exitPromise;
    
    // Verify the process exited (might be with error code since the child exits)
    expect(run.exitCode).not.toBeNull();
  }, 10000);

  it('should set SENTRY_SPOTLIGHT environment variable', async () => {
    // Create a temp script that checks for SENTRY_SPOTLIGHT
    const scriptPath = path.join(process.cwd(), `test-env-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      if (!process.env.SENTRY_SPOTLIGHT) {
        console.error('SENTRY_SPOTLIGHT not set');
        process.exit(1);
      }
      console.log('SENTRY_SPOTLIGHT=' + process.env.SENTRY_SPOTLIGHT);
      process.exit(0);
      `,
      'utf-8',
    );

    const run = spawnSpotlight(['run', 'node', scriptPath]);
    activeProcesses.push(run);

    // Wait for output
    await waitForOutput(run, /SENTRY_SPOTLIGHT=/, 5000, 'stderr');

    const output = [...run.stdout, ...run.stderr].join('');
    
    // Should have SENTRY_SPOTLIGHT set with proper format
    expect(output).toMatch(/SENTRY_SPOTLIGHT=http:\/\/localhost:\d+\/stream/);
  }, 10000);

  it('should set SENTRY_SPOTLIGHT with correct port format', async () => {
    const scriptPath = path.join(process.cwd(), `test-port-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      const url = process.env.SENTRY_SPOTLIGHT;
      console.log('URL=' + url);
      
      // Parse URL to check format
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('Invalid protocol');
        }
        if (parsed.pathname !== '/stream') {
          throw new Error('Invalid path');
        }
        console.log('URL is valid');
      } catch (e) {
        console.error('Invalid URL:', e.message);
        process.exit(1);
      }
      `,
      'utf-8',
    );

    const run = spawnSpotlight(['run', 'node', scriptPath]);
    activeProcesses.push(run);

    // Wait for validation output
    await waitForOutput(run, /URL is valid|Invalid URL/, 5000, 'stderr');

    const output = [...run.stdout, ...run.stderr].join('');
    expect(output).toMatch(/URL is valid/);
  }, 10000);

  it('should run with dynamic port assignment (-p 0)', async () => {
    const scriptPath = path.join(process.cwd(), `test-dynamic-port-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      const url = process.env.SENTRY_SPOTLIGHT;
      console.log('Dynamic URL=' + url);
      const parsed = new URL(url);
      console.log('Dynamic Port=' + parsed.port);
      `,
      'utf-8',
    );

    const run = spawnSpotlight(['run', '-p', '0', 'node', scriptPath]);
    activeProcesses.push(run);

    // Wait for port output
    await waitForOutput(run, /Dynamic Port=\d+/, 5000, 'stderr');

    const output = [...run.stdout, ...run.stderr].join('');
    expect(output).toMatch(/Dynamic Port=\d+/);
    
    // Port should not be 0 in the URL
    expect(output).not.toMatch(/Dynamic Port=0/);
  }, 10000);

  it('should run with custom port', async () => {
    const port = await findFreePort();
    const scriptPath = path.join(process.cwd(), `test-custom-port-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      const url = process.env.SENTRY_SPOTLIGHT;
      console.log('Custom URL=' + url);
      const parsed = new URL(url);
      console.log('Custom Port=' + parsed.port);
      `,
      'utf-8',
    );

    const run = spawnSpotlight(['run', '-p', port.toString(), 'node', scriptPath]);
    activeProcesses.push(run);

    // Wait for port output
    await waitForOutput(run, /Custom Port=/, 5000, 'stderr');

    const output = [...run.stdout, ...run.stderr].join('');
    expect(output).toContain(`Custom Port=${port}`);
  }, 10000);

  it('should capture stdout as logs', async () => {
    const scriptPath = path.join(process.cwd(), `test-stdout-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      console.log('This is stdout');
      setTimeout(() => process.exit(0), 100);
      `,
      'utf-8',
    );

    const run = spawnSpotlight(['run', 'node', scriptPath]);
    activeProcesses.push(run);

    // Wait for "This is stdout" to appear
    await waitForOutput(run, /This is stdout/, 5000, 'stderr');

    const output = [...run.stdout, ...run.stderr].join('');
    expect(output).toContain('This is stdout');
  }, 10000);

  it('should capture stderr as logs', async () => {
    const scriptPath = path.join(process.cwd(), `test-stderr-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      console.error('This is stderr');
      setTimeout(() => process.exit(0), 100);
      `,
      'utf-8',
    );

    const run = spawnSpotlight(['run', 'node', scriptPath]);
    activeProcesses.push(run);

    // Wait for "This is stderr" to appear
    await waitForOutput(run, /This is stderr/, 5000, 'stderr');

    const output = [...run.stdout, ...run.stderr].join('');
    expect(output).toContain('This is stderr');
  }, 10000);

  it('should forward NEXT_PUBLIC_SENTRY_SPOTLIGHT for Next.js', async () => {
    const scriptPath = path.join(process.cwd(), `test-nextjs-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      if (process.env.NEXT_PUBLIC_SENTRY_SPOTLIGHT) {
        console.log('NEXT_PUBLIC_SENTRY_SPOTLIGHT=' + process.env.NEXT_PUBLIC_SENTRY_SPOTLIGHT);
      } else {
        console.error('NEXT_PUBLIC_SENTRY_SPOTLIGHT not set');
      }
      `,
      'utf-8',
    );

    const run = spawnSpotlight(['run', 'node', scriptPath]);
    activeProcesses.push(run);

    // Wait for output
    await waitForOutput(run, /NEXT_PUBLIC_SENTRY_SPOTLIGHT=/, 5000, 'stderr');

    const output = [...run.stdout, ...run.stderr].join('');
    expect(output).toMatch(/NEXT_PUBLIC_SENTRY_SPOTLIGHT=http:\/\/localhost:\d+\/stream/);
  }, 10000);

  it('should set SENTRY_TRACES_SAMPLE_RATE', async () => {
    const scriptPath = path.join(process.cwd(), `test-sample-rate-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    await fs.writeFile(
      scriptPath,
      `
      console.log('SAMPLE_RATE=' + process.env.SENTRY_TRACES_SAMPLE_RATE);
      `,
      'utf-8',
    );

    const run = spawnSpotlight(['run', 'node', scriptPath]);
    activeProcesses.push(run);

    // Wait for output
    await waitForOutput(run, /SAMPLE_RATE=/, 5000, 'stderr');

    const output = [...run.stdout, ...run.stderr].join('');
    expect(output).toContain('SAMPLE_RATE=1');
  }, 10000);

  it('should handle command that sends events to sidecar', async () => {
    const scriptPath = path.join(process.cwd(), `test-sidecar-${Date.now()}.js`);
    tempFiles.push(scriptPath);

    // Script that uses send_to_sidecar to send an envelope
    await fs.writeFile(
      scriptPath,
      `
      const http = require('http');
      const fs = require('fs');
      const path = require('path');
      
      const url = new URL(process.env.SENTRY_SPOTLIGHT);
      
      // Wait a bit for sidecar to be ready
      setTimeout(() => {
        const envelopePath = path.join('${getFixturePath('Capture.Message.txt').replace(/\\/g, '\\\\')}');
        const data = fs.readFileSync(envelopePath);
        
        const req = http.request({
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-sentry-envelope',
          },
        }, (res) => {
          console.log('Envelope sent, status:', res.statusCode);
          process.exit(0);
        });
        
        req.on('error', (e) => {
          console.error('Error sending envelope:', e.message);
          process.exit(1);
        });
        
        req.write(data);
        req.end();
      }, 1000);
      `,
      'utf-8',
    );

    const run = spawnSpotlight(['run', 'node', scriptPath]);
    activeProcesses.push(run);

    // Wait for envelope to be sent
    await waitForOutput(run, /Envelope sent|Error sending/, 10000, 'stderr');

    const output = [...run.stdout, ...run.stderr].join('');
    expect(output).toMatch(/Envelope sent, status: 2\d\d/);
  }, 15000);
});
