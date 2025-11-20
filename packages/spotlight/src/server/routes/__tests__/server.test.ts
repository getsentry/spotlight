import { brotliCompressSync, deflateSync, gzipSync } from "node:zlib";
import { events } from "fetch-event-stream";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { describe, expect, it } from "vitest";
import { envelopeReactClientSideError } from "../../formatters/md/__tests__/test_envelopes.ts";
import { isAllowedOrigin } from "../../utils/cors.ts";
import routes from "../index.ts";

// Create test app with CORS middleware
const app = new Hono()
  .use(
    cors({
      origin: origin => {
        return isAllowedOrigin(origin) ? origin : null;
      },
    }),
  )
  .route("/", routes);

describe("generic endpoints", () => {
  it("should return 200 on health check", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });

  it("should return 404 on unknown endpoint", async () => {
    const response = await app.request("/unknown");
    expect(response.status).toBe(404);
  });

  it("should return method not allowed on unknown method", async () => {
    const response = await app.request("/health", { method: "POST" });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("404 Not Found");
  });
});

describe("envelopes", () => {
  it("should be able to send and receive envelopes", async () => {
    const sendResponse = await app.request("/stream", {
      method: "POST",
      body: JSON.stringify(envelopeReactClientSideError),
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
    });
    expect(sendResponse.status).toBe(200);

    const receiveResponse = await app.request("/stream");
    expect(receiveResponse.status).toBe(200);

    const stream = events(receiveResponse);

    for await (const event of stream) {
      const jsonEnvelope = JSON.parse(event.data!);
      expect(jsonEnvelope[0].event_id).toEqual(envelopeReactClientSideError.event_id);

      break;
    }
  });

  it("should be able to clear envelopes", async () => {
    const response = await app.request("/clear", {
      method: "DELETE",
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Cleared");
  });
});

describe("encoded envelopes", () => {
  const compressors: Record<string, (buf: Buffer) => Buffer> = {
    gzip: gzipSync,
    deflate: deflateSync,
    brotli: brotliCompressSync,
  };

  function testEncodedEnvelope(encoding: string) {
    return async () => {
      const sendResponse = await app.request("/stream", {
        method: "POST",
        body: compressors[encoding](Buffer.from(JSON.stringify(envelopeReactClientSideError))),
        headers: {
          "Content-Type": "application/x-sentry-envelope",
          "Content-Encoding": encoding,
        },
      });
      expect(sendResponse.status).toBe(200);

      const receiveResponse = await app.request("/stream");
      expect(receiveResponse.status).toBe(200);

      const stream = events(receiveResponse);

      for await (const event of stream) {
        const jsonEnvelope = JSON.parse(event.data!);
        expect(jsonEnvelope[0].event_id).toEqual(envelopeReactClientSideError.event_id);

        break;
      }
    };
  }

  it("gzip", testEncodedEnvelope("gzip"));
  it("deflate", testEncodedEnvelope("deflate"));
  it("brotli", testEncodedEnvelope("brotli"));
});

describe("mcp", () => {
  it("should get no errors", async () => {
    const mcpResponse = await app.request("/mcp", {
      method: "POST",
      body: JSON.stringify({
        id: 0,
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "search_errors",
          arguments: {
            filters: {
              timeWindow: 60,
            },
          },
        },
      }),
      headers: {
        "Content-Type": "application/json",
        accept: "application/json, text/event-stream",
      },
    });

    let data: string | undefined;

    for await (const event of events(mcpResponse)) {
      data = event.data;
      break;
    }

    expect(mcpResponse.status).toBe(200);

    expect(data).toBeDefined();

    const parsed = JSON.parse(data!);

    expect(parsed.result.content.length).toBeGreaterThan(0);
    expect(parsed.result.content[0].type).toBe("text");

    const markdown = parsed.result.content[0].text;

    expect(markdown).toContain("No errors detected in Spotlight");
  });

  it("should be able to get errors", async () => {
    const sendResponse = await app.request("/stream", {
      method: "POST",
      body: JSON.stringify(envelopeReactClientSideError),
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
    });
    expect(sendResponse.status).toBe(200);

    const mcpResponse = await app.request("/mcp", {
      method: "POST",
      body: JSON.stringify({
        id: 0,
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "search_errors",
          arguments: {
            filters: {
              timeWindow: 60,
            },
          },
        },
      }),
      headers: {
        "Content-Type": "application/json",
        accept: "application/json, text/event-stream",
      },
    });

    let data: string | undefined;

    for await (const event of events(mcpResponse)) {
      data = event.data;
      break;
    }

    expect(mcpResponse.status).toBe(200);

    expect(data).toBeDefined();

    const parsed = JSON.parse(data!);

    expect(parsed.result.content.length).toBeGreaterThan(0);
    expect(parsed.result.content[0].type).toBe("text");

    // TODO: Need to improve the sample data to make this work
    // expect(markdown).toContain("app/page.tsx");
    // expect(markdown).toContain(
    //   'You\'re importing a component that needs `useState`. This React Hook only works in a Client Component. To fix, mark the file (or its parent) with the `"use client"` directive.',
    // );
  });
});

describe("CORS origin validation", () => {
  describe("isAllowedOrigin function", () => {
    it("should allow localhost with http", () => {
      expect(isAllowedOrigin("http://localhost")).toBe(true);
      expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
      expect(isAllowedOrigin("http://localhost:8080")).toBe(true);
    });

    it("should allow localhost with https", () => {
      expect(isAllowedOrigin("https://localhost")).toBe(true);
      expect(isAllowedOrigin("https://localhost:3000")).toBe(true);
      expect(isAllowedOrigin("https://localhost:8443")).toBe(true);
    });

    it("should allow 127.0.0.1 with any port", () => {
      expect(isAllowedOrigin("http://127.0.0.1")).toBe(true);
      expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(true);
      expect(isAllowedOrigin("https://127.0.0.1")).toBe(true);
      expect(isAllowedOrigin("https://127.0.0.1:8443")).toBe(true);
    });

    it("should allow IPv6 localhost with any port", () => {
      expect(isAllowedOrigin("http://[::1]")).toBe(true);
      expect(isAllowedOrigin("http://[::1]:3000")).toBe(true);
      expect(isAllowedOrigin("https://[::1]")).toBe(true);
      expect(isAllowedOrigin("https://[::1]:8443")).toBe(true);
    });

    it("should allow https://spotlightjs.com", () => {
      expect(isAllowedOrigin("https://spotlightjs.com")).toBe(true);
    });

    it("should allow https subdomains of spotlightjs.com", () => {
      expect(isAllowedOrigin("https://www.spotlightjs.com")).toBe(true);
      expect(isAllowedOrigin("https://app.spotlightjs.com")).toBe(true);
      expect(isAllowedOrigin("https://staging.spotlightjs.com")).toBe(true);
    });

    it("should reject http://spotlightjs.com (must be https)", () => {
      expect(isAllowedOrigin("http://spotlightjs.com")).toBe(false);
      expect(isAllowedOrigin("http://www.spotlightjs.com")).toBe(false);
    });

    it("should reject spotlightjs.com with non-standard ports", () => {
      expect(isAllowedOrigin("https://spotlightjs.com:8080")).toBe(false);
      expect(isAllowedOrigin("https://www.spotlightjs.com:3000")).toBe(false);
      expect(isAllowedOrigin("https://app.spotlightjs.com:8443")).toBe(false);
    });

    it("should reject random websites", () => {
      expect(isAllowedOrigin("https://example.com")).toBe(false);
      expect(isAllowedOrigin("https://evil.com")).toBe(false);
      expect(isAllowedOrigin("https://google.com")).toBe(false);
    });

    it("should reject domains that just end with spotlightjs.com", () => {
      expect(isAllowedOrigin("https://evilspotlightjs.com")).toBe(false);
      expect(isAllowedOrigin("https://notspotlightjs.com")).toBe(false);
    });

    it("should reject empty or invalid origins", () => {
      expect(isAllowedOrigin("")).toBe(false);
      expect(isAllowedOrigin("not-a-url")).toBe(false);
      expect(isAllowedOrigin("ftp://localhost")).toBe(true); // localhost is allowed with any protocol
    });
  });

  describe("CORS headers in requests", () => {
    it("should set CORS headers for allowed localhost origins", async () => {
      const response = await app.request("/health", {
        headers: {
          Origin: "http://localhost:3000",
        },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    });

    it("should set CORS headers for allowed spotlightjs.com origins", async () => {
      const response = await app.request("/health", {
        headers: {
          Origin: "https://spotlightjs.com",
        },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://spotlightjs.com");
    });

    it("should set CORS headers for allowed spotlightjs.com subdomain origins", async () => {
      const response = await app.request("/health", {
        headers: {
          Origin: "https://app.spotlightjs.com",
        },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.spotlightjs.com");
    });

    it("should not set CORS headers for disallowed origins", async () => {
      const response = await app.request("/health", {
        headers: {
          Origin: "https://evil.com",
        },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("should not set CORS headers for http spotlightjs.com", async () => {
      const response = await app.request("/health", {
        headers: {
          Origin: "http://spotlightjs.com",
        },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("should not set CORS headers for spotlightjs.com with non-standard port", async () => {
      const response = await app.request("/health", {
        headers: {
          Origin: "https://spotlightjs.com:8080",
        },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });
});
