import { readdir, unlink } from "node:fs/promises";
import { brotliCompressSync, deflateSync, gzipSync } from "node:zlib";
import { events } from "fetch-event-stream";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { envelopeReactClientSideError } from "../../formatters/md/__tests__/test_envelopes.ts";
import { clearDnsCache, isAllowedOrigin } from "../../utils/cors.ts";
import routes from "../index.ts";

// Create test app with async CORS middleware
const app = new Hono()
  .use(
    cors({
      origin: async origin => ((await isAllowedOrigin(origin)) ? origin : null),
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
    br: brotliCompressSync,
  };

  function testEncodedEnvelope(encoding: string) {
    return async () => {
      const sendResponse = await app.request("/stream", {
        method: "POST",
        body: new Uint8Array(compressors[encoding](Buffer.from(JSON.stringify(envelopeReactClientSideError)))),
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
  it("br", testEncodedEnvelope("br"));
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
  // Clear DNS cache before each test to ensure isolation
  beforeEach(() => {
    clearDnsCache();
  });

  describe("isAllowedOrigin function - IP addresses", () => {
    it("should allow 127.0.0.1 with any port (direct IP check)", async () => {
      await expect(isAllowedOrigin("http://127.0.0.1")).resolves.toBe(true);
      await expect(isAllowedOrigin("http://127.0.0.1:3000")).resolves.toBe(true);
      await expect(isAllowedOrigin("https://127.0.0.1")).resolves.toBe(true);
      await expect(isAllowedOrigin("https://127.0.0.1:8443")).resolves.toBe(true);
    });

    it("should allow other 127.x.x.x addresses", async () => {
      await expect(isAllowedOrigin("http://127.0.0.2")).resolves.toBe(true);
      await expect(isAllowedOrigin("http://127.255.255.255")).resolves.toBe(true);
    });

    it("should allow IPv6 localhost with any port", async () => {
      await expect(isAllowedOrigin("http://[::1]")).resolves.toBe(true);
      await expect(isAllowedOrigin("http://[::1]:3000")).resolves.toBe(true);
      await expect(isAllowedOrigin("https://[::1]")).resolves.toBe(true);
      await expect(isAllowedOrigin("https://[::1]:8443")).resolves.toBe(true);
    });

    it("should reject external IP addresses not belonging to this machine", async () => {
      // These are well-known public IPs that won't be assigned to a dev machine
      await expect(isAllowedOrigin("http://8.8.8.8")).resolves.toBe(false); // Google DNS
      await expect(isAllowedOrigin("http://1.1.1.1")).resolves.toBe(false); // Cloudflare DNS
      await expect(isAllowedOrigin("http://93.184.216.34")).resolves.toBe(false); // example.com
    });

    it("should allow machine's own IP addresses from network interfaces", async () => {
      // Get one of the machine's actual IPs to test
      const os = await import("node:os");
      const interfaces = os.networkInterfaces();
      let machineIP: string | null = null;

      // Find a non-loopback IPv4 address
      for (const name in interfaces) {
        const addrs = interfaces[name];
        if (addrs) {
          for (const addr of addrs) {
            if (addr.family === "IPv4" && !addr.internal) {
              machineIP = addr.address;
              break;
            }
          }
        }
        if (machineIP) break;
      }

      // If we found a machine IP, test it
      if (machineIP) {
        await expect(isAllowedOrigin(`http://${machineIP}`)).resolves.toBe(true);
        await expect(isAllowedOrigin(`http://${machineIP}:3000`)).resolves.toBe(true);
      }
    });
  });

  describe("isAllowedOrigin function - DNS resolution", () => {
    it("should allow localhost (resolves to 127.0.0.1)", async () => {
      // localhost should resolve to 127.0.0.1 via /etc/hosts or DNS
      await expect(isAllowedOrigin("http://localhost")).resolves.toBe(true);
      await expect(isAllowedOrigin("http://localhost:3000")).resolves.toBe(true);
      await expect(isAllowedOrigin("http://localhost:8080")).resolves.toBe(true);
    });

    it("should allow localhost with https", async () => {
      await expect(isAllowedOrigin("https://localhost")).resolves.toBe(true);
      await expect(isAllowedOrigin("https://localhost:3000")).resolves.toBe(true);
      await expect(isAllowedOrigin("https://localhost:8443")).resolves.toBe(true);
    });

    it("should allow localhost with ftp (any protocol)", async () => {
      await expect(isAllowedOrigin("ftp://localhost")).resolves.toBe(true);
    });
  });

  describe("isAllowedOrigin function - spotlightjs.com", () => {
    it("should allow https://spotlightjs.com", async () => {
      await expect(isAllowedOrigin("https://spotlightjs.com")).resolves.toBe(true);
    });

    it("should allow https subdomains of spotlightjs.com", async () => {
      await expect(isAllowedOrigin("https://www.spotlightjs.com")).resolves.toBe(true);
      await expect(isAllowedOrigin("https://app.spotlightjs.com")).resolves.toBe(true);
      await expect(isAllowedOrigin("https://staging.spotlightjs.com")).resolves.toBe(true);
    });

    it("should reject http://spotlightjs.com (must be https)", async () => {
      await expect(isAllowedOrigin("http://spotlightjs.com")).resolves.toBe(false);
      await expect(isAllowedOrigin("http://www.spotlightjs.com")).resolves.toBe(false);
    });

    it("should reject spotlightjs.com with non-standard ports", async () => {
      await expect(isAllowedOrigin("https://spotlightjs.com:8080")).resolves.toBe(false);
      await expect(isAllowedOrigin("https://www.spotlightjs.com:3000")).resolves.toBe(false);
      await expect(isAllowedOrigin("https://app.spotlightjs.com:8443")).resolves.toBe(false);
    });
  });

  describe("isAllowedOrigin function - rejected origins", () => {
    it("should reject random websites", async () => {
      await expect(isAllowedOrigin("https://example.com")).resolves.toBe(false);
      await expect(isAllowedOrigin("https://evil.com")).resolves.toBe(false);
      await expect(isAllowedOrigin("https://google.com")).resolves.toBe(false);
    });

    it("should reject domains that just end with spotlightjs.com", async () => {
      await expect(isAllowedOrigin("https://evilspotlightjs.com")).resolves.toBe(false);
      await expect(isAllowedOrigin("https://notspotlightjs.com")).resolves.toBe(false);
    });

    it("should reject empty or invalid origins", async () => {
      await expect(isAllowedOrigin("")).resolves.toBe(false);
      await expect(isAllowedOrigin("not-a-url")).resolves.toBe(false);
    });
  });

  describe("isAllowedOrigin function - caching", () => {
    it("should cache DNS resolution results", async () => {
      // First call - triggers DNS resolution
      await expect(isAllowedOrigin("http://localhost")).resolves.toBe(true);

      // Second call - should use cached result (faster)
      const start = Date.now();
      await expect(isAllowedOrigin("http://localhost")).resolves.toBe(true);
      const duration = Date.now() - start;

      // Cached result should be very fast (< 5ms typically)
      expect(duration).toBeLessThan(50);
    });

    it("should cache results for different ports of same hostname", async () => {
      // Resolve with one port
      await expect(isAllowedOrigin("http://localhost:3000")).resolves.toBe(true);

      // Same hostname, different port - should use cache
      await expect(isAllowedOrigin("http://localhost:8080")).resolves.toBe(true);
    });

    it("should cache negative results (non-localhost hostnames)", async () => {
      // First call - DNS resolution
      await expect(isAllowedOrigin("https://example.com")).resolves.toBe(false);

      // Second call - should use cached negative result
      await expect(isAllowedOrigin("https://example.com")).resolves.toBe(false);
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

    it("should set CORS headers for allowed 127.0.0.1 origins", async () => {
      const response = await app.request("/health", {
        headers: {
          Origin: "http://127.0.0.1:3000",
        },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://127.0.0.1:3000");
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

describe("SPOTLIGHT_CAPTURE", () => {
  afterEach(async () => {
    process.env.SPOTLIGHT_CAPTURE = "";

    // Clean up any capture files created during tests
    const files = await readdir(".");
    for (const file of files) {
      if (file.startsWith("application_x_sentry_envelope-") && file.endsWith(".txt")) {
        await unlink(file);
      }
    }
  });

  it("should write envelope to file when SPOTLIGHT_CAPTURE is enabled", async () => {
    process.env.SPOTLIGHT_CAPTURE = "1";

    const sendResponse = await app.request("/stream", {
      method: "POST",
      body: JSON.stringify(envelopeReactClientSideError),
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
    });

    expect(sendResponse.status).toBe(200);

    // Wait for async file write to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check that a capture file was created
    const files = await readdir(".");
    const captureFiles = files.filter(f => f.startsWith("application_x_sentry_envelope-") && f.endsWith(".txt"));

    expect(captureFiles.length).toBeGreaterThanOrEqual(1);
  });

  it("should not write envelope to file when SPOTLIGHT_CAPTURE is not set", async () => {
    // Ensure SPOTLIGHT_CAPTURE is not set (empty string is falsy)
    process.env.SPOTLIGHT_CAPTURE = "";

    // Clean any existing files first
    const filesBefore = await readdir(".");
    for (const file of filesBefore) {
      if (file.startsWith("application_x_sentry_envelope-") && file.endsWith(".txt")) {
        await unlink(file);
      }
    }

    const sendResponse = await app.request("/stream", {
      method: "POST",
      body: JSON.stringify(envelopeReactClientSideError),
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
    });

    expect(sendResponse.status).toBe(200);

    // Wait to ensure no file is written
    await new Promise(resolve => setTimeout(resolve, 50));

    const filesAfter = await readdir(".");
    const captureFiles = filesAfter.filter(f => f.startsWith("application_x_sentry_envelope-") && f.endsWith(".txt"));

    expect(captureFiles.length).toBe(0);
  });
});
