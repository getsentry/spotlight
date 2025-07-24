import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { McpIntegration, type McpIntegrationOptions } from "./mcpIntegration.js";
import type { ContextLinesHandler } from "./nodeCompatibilityLayer.js";

// Mock all external dependencies
vi.mock("./logger.js", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the mcpStore to avoid import issues during tests
vi.mock("./mcpStore.js", () => ({
  createMcpSentryStore: vi.fn().mockReturnValue({
    getState: vi.fn().mockReturnValue({
      pushEnvelope: vi.fn().mockReturnValue(1),
      getEvents: vi.fn().mockReturnValue([]),
      tracesById: new Map(),
      getEventById: vi.fn().mockReturnValue(null),
      getTraceById: vi.fn().mockReturnValue(null),
      getLogsByTraceId: vi.fn().mockReturnValue([]),
      getLogs: vi.fn().mockReturnValue([]),
      profilesByTraceId: new Map(),
      sdks: new Map(),
      resetData: vi.fn(),
    }),
  }),
}));

vi.mock("./mcpServer.js", () => ({
  createSpotlightMcpServer: vi.fn().mockReturnValue({
    connect: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(config => ({
    handleRequest: vi.fn(),
    config,
  })),
}));

describe("McpIntegration", () => {
  let integration: McpIntegration;
  let mockContextLinesHandler: ContextLinesHandler;

  beforeEach(() => {
    mockContextLinesHandler = vi.fn().mockResolvedValue({ frames: [] });
  });

  afterEach(() => {
    if (integration) {
      integration.close();
    }
    vi.clearAllMocks();
  });

  test("should initialize with default options", () => {
    integration = new McpIntegration();
    expect(integration).toBeDefined();
    expect(integration.getEventProcessor()).toBeDefined();
  });

  test("should initialize with custom options", () => {
    const options: McpIntegrationOptions = {
      enabled: true,
      tools: {
        "get-recent-errors": { enabled: true },
      },
      resources: {
        "spotlight://errors/recent": { enabled: true, cacheTtl: 300 },
      },
    };

    integration = new McpIntegration(options, mockContextLinesHandler);
    expect(integration).toBeDefined();
  });

  test("should initialize with disabled state", () => {
    const options: McpIntegrationOptions = {
      enabled: false,
    };

    integration = new McpIntegration(options);
    expect(integration).toBeDefined();
    expect(integration.getMcpServer()).toBeNull();
    expect(integration.getTransport()).toBeNull();
  });

  test("should process Sentry envelope payload", async () => {
    integration = new McpIntegration();
    const mockData = Buffer.from('{"test": "envelope"}');

    await expect(integration.processPayload("application/x-sentry-envelope", mockData)).resolves.not.toThrow();
  });

  test("should ignore non-Sentry payloads", async () => {
    integration = new McpIntegration();
    const mockData = Buffer.from('{"test": "data"}');

    await expect(integration.processPayload("application/json", mockData)).resolves.not.toThrow();
  });

  test("should handle payload processing errors gracefully", async () => {
    integration = new McpIntegration();
    const invalidData = Buffer.from("invalid data");

    await expect(integration.processPayload("application/x-sentry-envelope", invalidData)).resolves.not.toThrow();
  });

  test("should not process payload when disabled", async () => {
    integration = new McpIntegration({ enabled: false });
    const mockData = Buffer.from('{"test": "envelope"}');

    await expect(integration.processPayload("application/x-sentry-envelope", mockData)).resolves.not.toThrow();
  });

  test("should subscribe to message buffer", () => {
    integration = new McpIntegration();

    const mockBuffer = {
      subscribe: vi.fn().mockReturnValue("subscription-id"),
      unsubscribe: vi.fn(),
    };

    const unsubscribe = integration.subscribeToBuffer(mockBuffer);

    expect(mockBuffer.subscribe).toHaveBeenCalledWith(expect.any(Function));
    expect(typeof unsubscribe).toBe("function");

    // Test unsubscribe
    unsubscribe();
    expect(mockBuffer.unsubscribe).toHaveBeenCalledWith("subscription-id");
  });

  test("should return empty unsubscribe function when disabled", () => {
    integration = new McpIntegration({ enabled: false });

    const mockBuffer = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };

    const unsubscribe = integration.subscribeToBuffer(mockBuffer);

    expect(mockBuffer.subscribe).not.toHaveBeenCalled();
    expect(typeof unsubscribe).toBe("function");

    // Should not throw when called
    expect(() => unsubscribe()).not.toThrow();
  });

  test("should handle MCP request when enabled", async () => {
    integration = new McpIntegration();

    const mockReq = {} as IncomingMessage;
    const mockRes = {
      writeHead: vi.fn(),
      end: vi.fn(),
      headersSent: false,
    } as unknown as ServerResponse;

    await expect(integration.handleMcpRequest(mockReq, mockRes)).resolves.not.toThrow();
  });

  test("should return 404 when MCP request is made but integration is disabled", async () => {
    integration = new McpIntegration({ enabled: false });

    const mockReq = {} as IncomingMessage;
    const mockRes = {
      writeHead: vi.fn(),
      end: vi.fn(),
      headersSent: false,
    } as unknown as ServerResponse;

    await integration.handleMcpRequest(mockReq, mockRes);

    expect(mockRes.writeHead).toHaveBeenCalledWith(404);
    expect(mockRes.end).toHaveBeenCalledWith("MCP server not enabled");
  });

  test("should handle MCP request errors gracefully", async () => {
    integration = new McpIntegration();

    // Mock transport to throw error
    const mockTransport = integration.getTransport();
    if (mockTransport) {
      vi.mocked(mockTransport.handleRequest).mockRejectedValue(new Error("Transport error"));
    }

    const mockReq = {} as IncomingMessage;
    const mockRes = {
      writeHead: vi.fn(),
      end: vi.fn(),
      headersSent: false,
    } as unknown as ServerResponse;

    await integration.handleMcpRequest(mockReq, mockRes);

    expect(mockRes.writeHead).toHaveBeenCalledWith(500);
    expect(mockRes.end).toHaveBeenCalledWith("Internal Server Error");
  });

  test("should not set error response if headers already sent", async () => {
    integration = new McpIntegration();

    // Mock transport to throw error
    const mockTransport = integration.getTransport();
    if (mockTransport) {
      vi.mocked(mockTransport.handleRequest).mockRejectedValue(new Error("Transport error"));
    }

    const mockReq = {} as IncomingMessage;
    const mockRes = {
      writeHead: vi.fn(),
      end: vi.fn(),
      headersSent: true, // Headers already sent
    } as unknown as ServerResponse;

    await integration.handleMcpRequest(mockReq, mockRes);

    expect(mockRes.writeHead).not.toHaveBeenCalled();
    expect(mockRes.end).not.toHaveBeenCalled();
  });

  test("should return event processor", () => {
    integration = new McpIntegration();
    const processor = integration.getEventProcessor();
    expect(processor).toBeDefined();
  });

  test("should close integration gracefully", async () => {
    integration = new McpIntegration();
    await expect(integration.close()).resolves.not.toThrow();
  });

  test("should close integration when MCP server is null", async () => {
    integration = new McpIntegration({ enabled: false });
    await expect(integration.close()).resolves.not.toThrow();
  });

  test("should process buffer subscription callback", () => {
    integration = new McpIntegration();

    const mockBuffer = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };

    // Get the callback that would be passed to buffer.subscribe
    integration.subscribeToBuffer(mockBuffer);
    const callback = vi.mocked(mockBuffer.subscribe).mock.calls[0][0];

    // Test the callback
    const mockPayload: [string, Buffer] = ["application/x-sentry-envelope", Buffer.from("test")];
    expect(() => callback(mockPayload)).not.toThrow();
  });
});
