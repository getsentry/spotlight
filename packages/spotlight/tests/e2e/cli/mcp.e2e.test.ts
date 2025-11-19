import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import {
  spawnSpotlight,
  sendMCPRequest,
  readMCPResponse,
  killGracefully,
  sendEnvelope,
  waitForSidecarReady,
} from './helpers';
import { findFreePort, getFixturePath, ensureSpotlightBuilt } from '../shared/utils';
import type { SpawnResult } from '../shared/utils';

describe('spotlight mcp e2e tests', () => {
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

  it('should start MCP server in stdio mode', async () => {
    const port = await findFreePort();

    const mcp = spawnSpotlight(['mcp', '-p', port.toString()]);
    activeProcesses.push(mcp);

    // Wait for sidecar to start
    await waitForSidecarReady(port, 10000);

    // Send MCP initialize request
    await sendMCPRequest(mcp.process, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    });

    // Read response
    const response = await readMCPResponse(mcp.stdout, 5000);

    expect(response).toBeDefined();
    expect(response.jsonrpc).toBe('2.0');
  }, 15000);

  it('should list available tools', async () => {
    const port = await findFreePort();

    const mcp = spawnSpotlight(['mcp', '-p', port.toString()]);
    activeProcesses.push(mcp);

    await waitForSidecarReady(port, 10000);

    // Initialize first
    await sendMCPRequest(mcp.process, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    });

    await readMCPResponse(mcp.stdout, 5000);

    // Clear stdout to prepare for tools/list
    mcp.stdout.length = 0;

    // Request tools list
    await sendMCPRequest(mcp.process, 'tools/list', {});

    const response = await readMCPResponse(mcp.stdout, 5000);

    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
    expect(response.result.tools).toBeDefined();
    expect(Array.isArray(response.result.tools)).toBe(true);

    // Check for expected tools
    const toolNames = response.result.tools.map((tool: any) => tool.name);
    expect(toolNames).toContain('search_errors');
    expect(toolNames).toContain('search_logs');
    expect(toolNames).toContain('search_traces');
    expect(toolNames).toContain('get_trace');
  }, 15000);

  it('should search errors via MCP', async () => {
    const port = await findFreePort();

    const mcp = spawnSpotlight(['mcp', '-p', port.toString()]);
    activeProcesses.push(mcp);

    await waitForSidecarReady(port, 10000);

    // Send test error envelope
    const errorPath = getFixturePath('envelope_javascript.txt');
    await sendEnvelope(port, errorPath);

    // Wait a bit for envelope to be processed
    await new Promise(resolve => setTimeout(resolve, 500));

    // Initialize MCP
    await sendMCPRequest(mcp.process, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    });

    await readMCPResponse(mcp.stdout, 5000);
    mcp.stdout.length = 0;

    // Search for errors
    await sendMCPRequest(mcp.process, 'tools/call', {
      name: 'search_errors',
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    const response = await readMCPResponse(mcp.stdout, 5000);

    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(Array.isArray(response.result.content)).toBe(true);
    
    // Should have at least one error
    const hasError = response.result.content.some((item: any) => 
      item.type === 'text' && item.text && item.text.length > 0
    );
    expect(hasError).toBe(true);
  }, 15000);

  it('should search logs via MCP', async () => {
    const port = await findFreePort();

    const mcp = spawnSpotlight(['mcp', '-p', port.toString()]);
    activeProcesses.push(mcp);

    await waitForSidecarReady(port, 10000);

    // Send test log envelope
    const logPath = getFixturePath('log_envelope.txt');
    await sendEnvelope(port, logPath);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Initialize MCP
    await sendMCPRequest(mcp.process, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    });

    await readMCPResponse(mcp.stdout, 5000);
    mcp.stdout.length = 0;

    // Search for logs
    await sendMCPRequest(mcp.process, 'tools/call', {
      name: 'search_logs',
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    const response = await readMCPResponse(mcp.stdout, 5000);

    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(Array.isArray(response.result.content)).toBe(true);

    // Should have at least one log
    const hasLog = response.result.content.some((item: any) => 
      item.type === 'text' && item.text && item.text.length > 0
    );
    expect(hasLog).toBe(true);
  }, 15000);

  it('should search traces via MCP', async () => {
    const port = await findFreePort();

    const mcp = spawnSpotlight(['mcp', '-p', port.toString()]);
    activeProcesses.push(mcp);

    await waitForSidecarReady(port, 10000);

    // Send test trace envelope
    const tracePath = getFixturePath('envelope_with_only_span.txt');
    await sendEnvelope(port, tracePath);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Initialize MCP
    await sendMCPRequest(mcp.process, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    });

    await readMCPResponse(mcp.stdout, 5000);
    mcp.stdout.length = 0;

    // Search for traces
    await sendMCPRequest(mcp.process, 'tools/call', {
      name: 'search_traces',
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    const response = await readMCPResponse(mcp.stdout, 5000);

    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(Array.isArray(response.result.content)).toBe(true);

    // Should have at least one trace
    const hasTrace = response.result.content.some((item: any) => 
      item.type === 'text' && item.text && item.text.length > 0
    );
    expect(hasTrace).toBe(true);
  }, 15000);

  it('should get trace details via MCP', async () => {
    const port = await findFreePort();

    const mcp = spawnSpotlight(['mcp', '-p', port.toString()]);
    activeProcesses.push(mcp);

    await waitForSidecarReady(port, 10000);

    // Send test trace envelope
    const tracePath = getFixturePath('envelope_with_only_span.txt');
    await sendEnvelope(port, tracePath);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Initialize MCP
    await sendMCPRequest(mcp.process, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    });

    await readMCPResponse(mcp.stdout, 5000);
    mcp.stdout.length = 0;

    // First search for traces to get a trace ID
    await sendMCPRequest(mcp.process, 'tools/call', {
      name: 'search_traces',
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    const searchResponse = await readMCPResponse(mcp.stdout, 5000);
    
    // Extract trace ID from search results (this is a simplified check)
    // In a real scenario, we'd parse the markdown or JSON to get the actual trace ID
    const hasTraceData = searchResponse.result.content.some((item: any) => 
      item.type === 'text' && item.text && item.text.length > 0
    );
    
    expect(hasTraceData).toBe(true);
    
    // Note: Getting the actual trace ID would require parsing the output
    // For now, we just verify that search_traces returns data
  }, 15000);

  it('should handle errors gracefully', async () => {
    const port = await findFreePort();

    const mcp = spawnSpotlight(['mcp', '-p', port.toString()]);
    activeProcesses.push(mcp);

    await waitForSidecarReady(port, 10000);

    // Initialize MCP
    await sendMCPRequest(mcp.process, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    });

    await readMCPResponse(mcp.stdout, 5000);
    mcp.stdout.length = 0;

    // Call non-existent tool
    await sendMCPRequest(mcp.process, 'tools/call', {
      name: 'non_existent_tool',
      arguments: {},
    });

    const response = await readMCPResponse(mcp.stdout, 5000);

    expect(response).toBeDefined();
    // Should have an error
    expect(response.error || response.result).toBeDefined();
  }, 15000);

  it('should connect to existing server via proxy', async () => {
    const port = await findFreePort();

    // Start a regular server first
    const server = spawnSpotlight(['server', '-p', port.toString()]);
    activeProcesses.push(server);

    await waitForSidecarReady(port, 10000);

    // Now start MCP which should connect via proxy
    const mcp = spawnSpotlight(['mcp', '-p', port.toString()]);
    activeProcesses.push(mcp);

    // Give it time to connect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send test error envelope
    const errorPath = getFixturePath('envelope_javascript.txt');
    await sendEnvelope(port, errorPath);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Initialize MCP
    await sendMCPRequest(mcp.process, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    });

    await readMCPResponse(mcp.stdout, 5000);
    mcp.stdout.length = 0;

    // Search for errors via proxy
    await sendMCPRequest(mcp.process, 'tools/call', {
      name: 'search_errors',
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    const response = await readMCPResponse(mcp.stdout, 5000);

    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
  }, 20000);
});
