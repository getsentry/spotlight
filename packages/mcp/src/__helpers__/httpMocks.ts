// HTTP test helpers to replace casting and complex mocks
import type { IncomingMessage, ServerResponse } from "node:http";
import { vi } from "vitest";

export interface MockResponse {
  writeHead: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  headersSent: boolean;
  statusCode?: number;
}

export interface MockRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
}

export function createMockResponse(
  options: {
    headersSent?: boolean;
    statusCode?: number;
  } = {},
): MockResponse {
  return {
    writeHead: vi.fn(),
    end: vi.fn(),
    headersSent: options.headersSent ?? false,
    statusCode: options.statusCode,
  };
}

export function createMockRequest(
  options: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  } = {},
): MockRequest {
  return {
    url: options.url ?? "/mcp",
    method: options.method ?? "POST",
    headers: options.headers ?? { "content-type": "application/json" },
  };
}

// Helper to verify HTTP response calls
export function expectHttpResponse(mockRes: MockResponse, expectedStatus: number, expectedBody?: string) {
  expect(mockRes.writeHead).toHaveBeenCalledWith(expectedStatus);
  if (expectedBody) {
    expect(mockRes.end).toHaveBeenCalledWith(expectedBody);
  }
}

// Helper to create typed mock objects for tests
export function createTypedMocks() {
  const mockReq = createMockRequest() as MockRequest & IncomingMessage;
  const mockRes = createMockResponse() as MockResponse & ServerResponse;

  return { mockReq, mockRes };
}
