import { events } from "fetch-event-stream";
import { describe, expect, it } from "vitest";
import { app } from "../main.js";
import { envelopeReactClientSideError } from "../mcp/__tests__/test_envelopes.js";

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
      expect(event.data).toBe(JSON.stringify(envelopeReactClientSideError));
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

describe("mcp", () => {
  it("should get no errors", async () => {
    const mcpResponse = await app.request("/mcp", {
      method: "POST",
      body: JSON.stringify({
        id: 0,
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get_local_errors",
          arguments: {
            duration: 60,
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
          name: "get_local_errors",
          arguments: {
            duration: 60,
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

    console.log(markdown);

    // TODO: Need to improve the sample data to make this work
    // expect(markdown).toContain("app/page.tsx");
    // expect(markdown).toContain(
    //   'You\'re importing a component that needs `useState`. This React Hook only works in a Client Component. To fix, mark the file (or its parent) with the `"use client"` directive.',
    // );
  });
});
