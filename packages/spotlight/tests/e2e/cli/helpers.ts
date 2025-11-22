import type { ChildProcess } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs/promises';
import {
  spawnProcess,
  killProcess,
  waitForOutputPattern,
  getSpotlightBinPath,
  type SpawnResult,
} from '../shared/utils';

/**
 * Spawn a spotlight CLI command
 */
export function spawnSpotlight(
  command: string[],
  env: NodeJS.ProcessEnv = {},
): SpawnResult {
  const binPath = getSpotlightBinPath();
  return spawnProcess('node', [binPath, ...command], env);
}

/**
 * Send an envelope file to the sidecar
 */
export async function sendEnvelope(
  port: number,
  envelopeFilePath: string,
  compression: 'none' | 'gzip' | 'br' | 'zstd' = 'none',
): Promise<void> {
  const data = await fs.readFile(envelopeFilePath);

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-sentry-envelope',
  };

  let body = data;

  // Handle compression if needed
  if (compression !== 'none') {
    const zlib = await import('node:zlib');
    const { promisify } = await import('node:util');
    
    switch (compression) {
      case 'gzip':
        body = await promisify(zlib.gzip)(data);
        headers['Content-Encoding'] = 'gzip';
        break;
      case 'br':
        body = await promisify(zlib.brotliCompress)(data);
        headers['Content-Encoding'] = 'br';
        break;
      case 'zstd':
        if (typeof zlib.zstdCompress === 'function') {
          body = await promisify(zlib.zstdCompress)(data);
          headers['Content-Encoding'] = 'zstd';
        } else {
          throw new Error('zstd compression not available in this Node.js version');
        }
        break;
    }
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: '/stream',
        method: 'POST',
        headers,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
        res.resume(); // Consume response data
      },
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Wait for a specific output pattern to appear in a process's output
 */
export async function waitForOutput(
  proc: SpawnResult,
  pattern: string | RegExp,
  timeout: number = 5000,
  source: 'stdout' | 'stderr' = 'stdout',
): Promise<string> {
  const output = source === 'stdout' ? proc.stdout : proc.stderr;
  return waitForOutputPattern(output, pattern, timeout);
}

/**
 * Send an MCP JSON-RPC request via stdin
 */
export async function sendMCPRequest(
  proc: ChildProcess,
  method: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params: params || {},
  };

  return new Promise((resolve, reject) => {
    if (!proc.stdin) {
      reject(new Error('Process stdin is not available'));
      return;
    }

    proc.stdin.write(JSON.stringify(request) + '\n', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Read MCP response from stdout
 */
export async function readMCPResponse(
  output: string[],
  timeout: number = 5000,
): Promise<any> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const allOutput = output.join('');
    const lines = allOutput.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.jsonrpc === '2.0') {
            return parsed;
          }
        } catch {
          // Not JSON, continue
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Timeout waiting for MCP response');
}

/**
 * Send SIGTERM and wait for graceful exit
 */
export async function killGracefully(
  proc: ChildProcess,
  timeout: number = 5000,
): Promise<void> {
  return killProcess(proc, 'SIGTERM');
}

/**
 * Wait for sidecar to be ready by checking health endpoint
 */
export async function waitForSidecarReady(
  port: number,
  timeout: number = 5000,
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(
          `http://localhost:${port}/`,
          (res) => {
            res.resume();
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
              resolve();
            } else {
              reject(new Error(`Health check failed with status ${res.statusCode}`));
            }
          },
        );
        req.on('error', reject);
        req.setTimeout(1000);
      });
      return; // Success
    } catch {
      // Retry
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`Sidecar not ready after ${timeout}ms`);
}

/**
 * Parse JSON lines from output
 */
export function parseJSONLines(output: string[]): any[] {
  const results: any[] = [];
  const allOutput = output.join('');
  const lines = allOutput.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      try {
        results.push(JSON.parse(trimmed));
      } catch {
        // Not valid JSON, skip
      }
    }
  }
  
  return results;
}
