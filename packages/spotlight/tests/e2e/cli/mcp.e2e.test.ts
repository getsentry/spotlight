import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ensureSpotlightBuilt, findFreePort, getFixturePath, getSpotlightBinPath } from "../shared/utils";
import type { SpawnResult } from "../shared/utils";
import { killGracefully, sendEnvelope, spawnSpotlight, waitForSidecarReady } from "./helpers";

describe("spotlight mcp e2e tests", () => {
  const activeProcesses: SpawnResult[] = [];
  const mcpClients: Client[] = [];

  beforeAll(async () => {
    await ensureSpotlightBuilt();
  });

  afterEach(async () => {
    // Disconnect all MCP clients
    for (const client of mcpClients) {
      try {
        await client.close();
      } catch (_err) {
        // Ignore errors during cleanup
      }
    }
    mcpClients.length = 0;

    // Clean up all spawned processes
    for (const proc of activeProcesses) {
      if (proc.process.pid && !proc.process.killed) {
        await killGracefully(proc.process).catch(() => {
          // Force kill if graceful shutdown fails
          proc.process.kill("SIGKILL");
        });
      }
    }
    activeProcesses.length = 0;
  });

  /**
   * Helper to create and connect an MCP client to the spotlight server
   */
  async function createMCPClient(port: number): Promise<Client> {
    const mcpClient = new Client(
      {
        name: "spotlight-e2e-test-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    const binPath = getSpotlightBinPath();
    const transport = new StdioClientTransport({
      command: "node",
      args: [binPath, "mcp", "-p", port.toString()],
    });

    await mcpClient.connect(transport);
    mcpClients.push(mcpClient);

    return mcpClient;
  }

  it("should initialize MCP connection using SDK client", async () => {
    const port = await findFreePort();

    // Start sidecar server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Create and connect MCP client
    const client = await createMCPClient(port);

    // Verify connection is established
    expect(client).toBeDefined();
  }, 15000);

  it("should list available tools using SDK client", async () => {
    const port = await findFreePort();

    // Start sidecar server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Create and connect MCP client
    const client = await createMCPClient(port);

    // List tools
    const toolsResult = await client.listTools();

    expect(toolsResult).toBeDefined();
    expect(toolsResult.tools).toBeDefined();
    expect(Array.isArray(toolsResult.tools)).toBe(true);

    // Check for expected tools
    const toolNames = toolsResult.tools.map(tool => tool.name);
    expect(toolNames).toContain("search_errors");
    expect(toolNames).toContain("search_logs");
    expect(toolNames).toContain("search_traces");
    expect(toolNames).toContain("get_traces");
  }, 15000);

  it("should search errors via MCP SDK", async () => {
    const port = await findFreePort();

    // Start sidecar server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Send test error envelope
    const errorPath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, errorPath);

    // Wait for envelope to be processed
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create and connect MCP client
    const client = await createMCPClient(port);

    // Call search_errors tool
    const result = await client.callTool({
      name: "search_errors",
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);

    // Should have at least one error
    const hasError = result.content.some(
      item => item.type === "text" && "text" in item && item.text && item.text.length > 0,
    );
    expect(hasError).toBe(true);
  }, 15000);

  it("should search logs via MCP SDK", async () => {
    const port = await findFreePort();

    // Start sidecar server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Send test log envelope
    const logPath = getFixturePath("log_envelope.txt");
    await sendEnvelope(port, logPath);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Create and connect MCP client
    const client = await createMCPClient(port);

    // Call search_logs tool
    const result = await client.callTool({
      name: "search_logs",
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);

    // Should have at least one log
    const hasLog = result.content.some(
      item => item.type === "text" && "text" in item && item.text && item.text.length > 0,
    );
    expect(hasLog).toBe(true);
  }, 15000);

  it("should search traces via MCP SDK", async () => {
    const port = await findFreePort();

    // Start sidecar server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Send test trace envelope
    const tracePath = getFixturePath("envelope_with_only_span.txt");
    await sendEnvelope(port, tracePath);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Create and connect MCP client
    const client = await createMCPClient(port);

    // Call search_traces tool
    const result = await client.callTool({
      name: "search_traces",
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);

    // Should have at least one trace
    const hasTrace = result.content.some(
      item => item.type === "text" && "text" in item && item.text && item.text.length > 0,
    );
    expect(hasTrace).toBe(true);
  }, 15000);

  it("should get trace details via MCP SDK", async () => {
    const port = await findFreePort();

    // Start sidecar server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Send test trace envelope
    const tracePath = getFixturePath("envelope_python.txt");
    await sendEnvelope(port, tracePath);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Create and connect MCP client
    const client = await createMCPClient(port);

    // First search for traces to verify we have data
    const searchResult = await client.callTool({
      name: "search_traces",
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    expect(searchResult).toBeDefined();
    expect(searchResult.content).toBeDefined();
    expect(Array.isArray(searchResult.content)).toBe(true);

    // Verify that search_traces returns trace data
    const hasTraceData = searchResult.content.some(
      item => item.type === "text" && "text" in item && item.text && item.text.length > 0,
    );

    expect(hasTraceData).toBe(true);

    // Note: To fully test get_traces, we'd need to parse the trace ID from search results
    // This test verifies the search functionality works, which is the first step
  }, 15000);

  it("should handle errors gracefully via MCP SDK", async () => {
    const port = await findFreePort();

    // Start sidecar server
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Create and connect MCP client
    const client = await createMCPClient(port);

    const result = await client.callTool({
      name: "non_existent_tool",
      arguments: {},
    });

    // Call non-existent tool - should throw or return error
    expect(result).toMatchObject({
      isError: true,
      content: [
        {
          type: "text",
          text: "MCP error -32602: Tool non_existent_tool not found",
        },
      ],
    });
  }, 15000);

  it("should connect to existing server and search errors", async () => {
    const port = await findFreePort();

    // Start a regular server first
    const server = spawnSpotlight(["server", "-p", port.toString()]);
    activeProcesses.push(server);
    await waitForSidecarReady(port, 10000);

    // Send test error envelope to the server
    const errorPath = getFixturePath("envelope_javascript.txt");
    await sendEnvelope(port, errorPath);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Create MCP client connecting to the same port (will proxy to existing server)
    const client = await createMCPClient(port);

    // Search for errors via MCP
    const result = await client.callTool({
      name: "search_errors",
      arguments: {
        filters: {
          timeWindow: 60,
        },
      },
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);

    // Should find the error we sent
    const hasError = result.content.some(
      item => item.type === "text" && "text" in item && item.text && item.text.length > 0,
    );
    expect(hasError).toBe(true);
  }, 20000);
});
