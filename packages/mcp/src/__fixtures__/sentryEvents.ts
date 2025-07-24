// Test fixtures for Sentry events to replace complex mocks
import type { SentryErrorEvent, SentryTransactionEvent } from "../nodeAdapter.js";

export const mockErrorEvent: SentryErrorEvent = {
  event_id: "error-1",
  type: "error",
  level: "error",
  timestamp: 1704110400000,
  exception: {
    values: [
      {
        type: "TypeError",
        value: "Cannot read property 'foo' of undefined",
        stacktrace: {
          frames: [
            {
              filename: "app.js",
              function: "processData",
              lineno: 42,
              colno: 15,
              context_line: "const value = obj.foo;",
              pre_context: ["function processData(obj) {", "  if (!obj) return;"],
              post_context: ["  return value;", "}"],
              in_app: true,
            },
            {
              filename: "utils.js",
              function: "helper",
              lineno: 10,
              colno: 5,
              context_line: "return processData(data);",
              pre_context: ["function helper() {", "  const data = getData();"],
              post_context: ["}", ""],
              in_app: true,
            },
          ],
        },
      },
    ],
    value: undefined,
  },
  contexts: {
    trace: {
      trace_id: "trace-1",
      span_id: "span-1",
      status: "internal_error",
    },
  },
  breadcrumbs: [
    {
      message: "User clicked submit button",
      category: "ui.click",
      timestamp: "2024-01-01T10:00:00Z",
      type: "user",
      data: { target: "button#submit" },
    },
    {
      message: "API request started",
      category: "http",
      timestamp: "2024-01-01T10:00:01Z",
      type: "http",
      data: { url: "/api/process", method: "POST" },
    },
  ],
  tags: {
    environment: "test",
    version: "1.0.0",
  },
  user: {
    id: "user-123",
    email: "test@example.com",
  },
  environment: "test",
  release: "1.0.0",
};

export const mockTransactionEvent: SentryTransactionEvent = {
  event_id: "transaction-1",
  type: "transaction",
  transaction: "GET /api/test",
  start_timestamp: "1704110400",
  timestamp: 1704110500000,
  contexts: {
    trace: {
      trace_id: "trace-1",
      span_id: "span-root",
      status: "ok",
      op: "http.server",
      description: "GET /api/test",
    },
  },
  spans: [
    {
      trace_id: "trace-1",
      span_id: "span-1",
      parent_span_id: "span-root",
      op: "db.query",
      description: "SELECT * FROM users",
      start_timestamp: 1704110400500,
      timestamp: 1704110400600,
      status: "ok",
      tags: { "db.type": "postgresql" },
    },
  ],
  tags: {
    environment: "test",
    http_status_code: "200",
  },
  environment: "test",
  release: "1.0.0",
};

export const mockTrace = {
  trace_id: "trace-1",
  status: "ok",
  rootTransactionName: "GET /api/test",
  spans: new Map([
    [
      "span-root",
      {
        span_id: "span-root",
        parent_span_id: null,
        op: "http.server",
        description: "GET /api/test",
        start_timestamp: 1704110400000,
        timestamp: 1704110500000,
        status: "ok",
      },
    ],
    [
      "span-1",
      {
        span_id: "span-1",
        parent_span_id: "span-root",
        op: "db.query",
        description: "SELECT * FROM users",
        start_timestamp: 1704110400500,
        timestamp: 1704110400600,
        status: "ok",
      },
    ],
  ]),
  errors: 1,
  start_timestamp: 1704110400000,
  timestamp: 1704110500000,
  transactions: [mockTransactionEvent],
  spanTree: [
    {
      span_id: "span-root",
      parent_span_id: null,
      op: "http.server",
      description: "GET /api/test",
      start_timestamp: 1704110400000,
      timestamp: 1704110500000,
      status: "ok",
      children: [
        {
          span_id: "span-1",
          parent_span_id: "span-root",
          op: "db.query",
          description: "SELECT * FROM users",
          start_timestamp: 1704110400500,
          timestamp: 1704110400600,
          status: "ok",
          children: [],
        },
      ],
    },
  ],
  profileGrafted: false,
};

export const mockLogEvent = {
  id: "log-1",
  attributes: {
    message: { value: "Processing request for user 123" },
    level: { value: "info" },
  },
  severity_text: "INFO",
  timestamp: 1704110450000,
  sdk: "test-sdk",
};

// Raw envelope data for testing
export const mockEnvelopeData = JSON.stringify(mockErrorEvent);

export const mockRawEventContext = {
  data: Buffer.from(mockEnvelopeData),
  contentType: "application/x-sentry-envelope",
};
