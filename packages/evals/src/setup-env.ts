import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { setupSidecar, clearBuffer } from "@spotlightjs/sidecar";
import type { Payload } from "@spotlightjs/test-fixtures";
import { beforeAll, afterAll, beforeEach } from "vitest";

let mcpClient: Client | null = null;
const PORT = 8970; // Use a different port from the default to avoid conflicts

/**
 * Wait for server to be ready
 */
async function waitForServer(port: number, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server failed to start on port ${port}`);
}

/**
 * Start the sidecar server and MCP client for all tests
 */
beforeAll(async () => {
  // Start the sidecar server
  setupSidecar({ port: PORT });
  
  // Wait for server to be ready
  await waitForServer(PORT);
  
  // Initialize MCP client
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://localhost:${PORT}/mcp`)
  );
  
  mcpClient = new Client({
    name: "spotlight-evals",
    version: "0.0.1",
  });
  
  await mcpClient.connect(transport);
  
  // Store client globally for tests to use
  (globalThis as any).__mcpClient = mcpClient;
  (globalThis as any).__sidecarPort = PORT;
});

/**
 * Clear buffer before each test
 */
beforeEach(async () => {
  clearBuffer();
});

/**
 * Clean up after all tests
 */
afterAll(async () => {
  if (mcpClient) {
    await mcpClient.close();
  }
  
  // The server will be cleaned up when the process exits
});

/**
 * Helper to send error data to the sidecar via the /stream endpoint
 */
export async function sendErrorToSidecar(payload: Payload): Promise<void> {
  const [contentType, data] = payload;
  
  const response = await fetch(`http://localhost:${PORT}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
    },
    body: data,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send error to sidecar: ${response.statusText}`);
  }
  
  // Give the server a moment to process the data
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Helper to clear the error buffer
 */
export async function clearErrorBuffer(): Promise<void> {
  clearBuffer();
}

/**
 * Get the MCP client instance
 */
export function getMcpClient(): Client {
  const client = (globalThis as any).__mcpClient;
  if (!client) {
    throw new Error("MCP client not initialized. Make sure setup-env.ts is loaded.");
  }
  return client;
}