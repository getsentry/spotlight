// @vitest-environment node
import type { Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/node", () => ({
  addEventProcessor: vi.fn(),
  captureException: vi.fn(),
  getTraceData: () => ({
    "sentry-trace": "00000000000000000000000000000000-0000000000000000",
    baggage: "",
  }),
  startSpan: (_options: unknown, callback: (span: { setAttribute: ReturnType<typeof vi.fn> }) => unknown) =>
    callback({ setAttribute: vi.fn() }),
}));

const { startServer } = await import("../main.ts");

describe("startServer", () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (!server) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      server!.close(error => (error ? reject(error) : resolve()));
    });
    server = undefined;
  });

  it("serves requests with query strings when hono query objects lack toString (#1343)", async () => {
    server = await startServer({ port: 0 });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("expected server address");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/health?foo=bar&baz=1`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });
});
