import { describe, expect, it } from "vitest";
import { formatEventOutput } from "../formatting.js";
import { processErrorEvent } from "../index.js";
import { envelopeReactClientSideError } from "./test_envelopes.js";

describe("tools", () => {
  it("should format error envelope", () => {
    const errorEvent = processErrorEvent(envelopeReactClientSideError);
    const markdown = formatEventOutput(errorEvent);

    expect(errorEvent.platform).toBe("javascript");
    expect(errorEvent.type).toBe("error");

    // Exception and request
    expect(errorEvent.entries.length).eq(2);

    expect(markdown).toContain("app/page.tsx");
    expect(markdown).toContain(
      `You're importing a component that needs \`useState\`. This React Hook only works in a Client Component. To fix, mark the file (or its parent) with the \`"use client"\` directive.`,
    );
  });
});
