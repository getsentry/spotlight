import type { Envelope } from "@sentry/core";
import { describe, expect, it } from "vitest";
import { inferEnvelopeSource } from "../utils.ts";

describe("inferEnvelopeSource", () => {
  it("infers a browser source when the browser runtime context is present and no browser User-Agent is available", () => {
    const header = { sdk: { name: "sentry.javascript.react", version: "10.0.0" } } as unknown as Envelope[0];
    const event = {
      platform: "javascript",
      contexts: { runtime: { name: "browser", version: "10.0.0" } },
    };

    expect(inferEnvelopeSource(header, [event])).toBe("browser");
  });

  it("still infers a server source for a non-browser runtime context", () => {
    const header = { sdk: { name: "sentry.javascript.node", version: "10.0.0" } } as unknown as Envelope[0];
    const event = {
      platform: "javascript",
      contexts: { runtime: { name: "node", version: "22.0.0" } },
    };

    expect(inferEnvelopeSource(header, [event])).toBe("server");
  });
});
