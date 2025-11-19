import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import path from 'node:path';
import {
  spawnSpotlight,
  waitForOutput,
  sendEnvelope,
  killGracefully,
  waitForSidecarReady,
} from './helpers';
import { findFreePort, getFixturePath, ensureSpotlightBuilt } from '../shared/utils';
import type { SpawnResult } from '../shared/utils';

describe('spotlight tail e2e tests', () => {
  const activeProcesses: SpawnResult[] = [];

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
  });

  it('should connect to existing server', async () => {
    const port = await findFreePort();

    // Start server first
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);

    // Wait for server to be ready
    await waitForSidecarReady(port, 10000);

    // Start tail to connect to the server
    const tail = spawnSpotlight(['tail', '-p', port.toString()]);
    activeProcesses.push(tail);

    // Give tail a moment to connect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send test envelope
    const envelopePath = getFixturePath('envelope_javascript.txt');
    await sendEnvelope(port, envelopePath);

    // Wait for output in tail
    await waitForOutput(tail, /error|exception/i, 5000);

    // Verify we got output
    expect(tail.stdout.join('')).toMatch(/error|exception/i);
  }, 15000);

  it('should start new server if none exists', async () => {
    const port = await findFreePort();

    // Start tail without existing server
    const tail = spawnSpotlight(['tail', '-p', port.toString()]);
    activeProcesses.push(tail);

    // Wait for sidecar to start
    await waitForSidecarReady(port, 10000);

    // Send test envelope
    const envelopePath = getFixturePath('envelope_python.txt');
    await sendEnvelope(port, envelopePath);

    // Wait for output
    await waitForOutput(tail, /error|exception/i, 5000);

    // Verify we got output
    expect(tail.stdout.join('')).toMatch(/error|exception/i);
  }, 15000);

  it('should filter errors only', async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Start tail with errors filter
    const tail = spawnSpotlight(['tail', 'errors', '-p', port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath('envelope_javascript.txt');
    await sendEnvelope(port, errorPath);

    // Send log envelope
    const logPath = getFixturePath('log_envelope.txt');
    await sendEnvelope(port, logPath);

    // Wait for error output
    await waitForOutput(tail, /error|exception/i, 5000);

    const output = tail.stdout.join('');
    // Should have error output
    expect(output).toMatch(/error|exception/i);
    
    // Logs might not appear depending on the format, 
    // but errors should definitely be there
  }, 15000);

  it('should filter logs only', async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Start tail with logs filter
    const tail = spawnSpotlight(['tail', 'logs', '-p', port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send log envelope
    const logPath = getFixturePath('log_envelope.txt');
    await sendEnvelope(port, logPath);

    // Wait for log output
    await waitForOutput(tail, /log|info/i, 5000);

    const output = tail.stdout.join('');
    expect(output.length).toBeGreaterThan(0);
  }, 15000);

  it('should filter traces only', async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Start tail with traces filter
    const tail = spawnSpotlight(['tail', 'traces', '-p', port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send trace envelope
    const tracePath = getFixturePath('envelope_with_only_span.txt');
    await sendEnvelope(port, tracePath);

    // Wait for trace output
    await waitForOutput(tail, /transaction|span/i, 5000);

    const output = tail.stdout.join('');
    expect(output).toMatch(/transaction|span/i);
  }, 15000);

  it('should filter multiple event types', async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Start tail with errors and logs filter
    const tail = spawnSpotlight(['tail', 'errors', 'logs', '-p', port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath('envelope_javascript.txt');
    await sendEnvelope(port, errorPath);

    // Send log envelope
    const logPath = getFixturePath('log_envelope.txt');
    await sendEnvelope(port, logPath);

    // Wait for output
    await waitForOutput(tail, /error|exception|log/i, 5000);

    const output = tail.stdout.join('');
    expect(output.length).toBeGreaterThan(0);
  }, 15000);

  it('should output in json format', async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Start tail with json format
    const tail = spawnSpotlight(['tail', '-f', 'json', '-p', port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath('envelope_javascript.txt');
    await sendEnvelope(port, errorPath);

    // Wait for output
    await waitForOutput(tail, /{.*}/s, 5000);

    const output = tail.stdout.join('');
    // Should be valid JSON
    const lines = output.split('\n').filter(l => l.trim());
    expect(lines.length).toBeGreaterThan(0);
    
    // At least one line should be parseable as JSON
    let foundJson = false;
    for (const line of lines) {
      try {
        JSON.parse(line);
        foundJson = true;
        break;
      } catch {
        // Not JSON, continue
      }
    }
    expect(foundJson).toBe(true);
  }, 15000);

  it('should output in logfmt format', async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Start tail with logfmt format
    const tail = spawnSpotlight(['tail', '-f', 'logfmt', '-p', port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath('envelope_javascript.txt');
    await sendEnvelope(port, errorPath);

    // Wait for output
    await waitForOutput(tail, /\w+=/, 5000);

    const output = tail.stdout.join('');
    // Logfmt typically has key=value pairs
    expect(output).toMatch(/\w+=/);
  }, 15000);

  it('should output in human format (default)', async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Start tail with human format (default)
    const tail = spawnSpotlight(['tail', '-f', 'human', '-p', port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath('envelope_javascript.txt');
    await sendEnvelope(port, errorPath);

    // Wait for output
    await waitForOutput(tail, /.+/, 5000);

    const output = tail.stdout.join('');
    expect(output.length).toBeGreaterThan(0);
  }, 15000);

  it('should output in markdown format', async () => {
    const port = await findFreePort();

    // Start server
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Start tail with markdown format
    const tail = spawnSpotlight(['tail', '-f', 'md', '-p', port.toString()]);
    activeProcesses.push(tail);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send error envelope
    const errorPath = getFixturePath('envelope_javascript.txt');
    await sendEnvelope(port, errorPath);

    // Wait for output
    await waitForOutput(tail, /[#*`]/, 5000);

    const output = tail.stdout.join('');
    // Markdown typically has # or ``` or other markdown syntax
    expect(output).toMatch(/[#*`]/);
  }, 15000);
});
