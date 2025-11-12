import { describe, expect, it } from "vitest";
import { processErrorEvent } from "../errors.ts";
import { formatEventOutput } from "../event.ts";
import { envelopeFetchRequestError, envelopeReactClientSideError } from "./test_envelopes.ts";

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
      'You\'re importing a component that needs `useState`. This React Hook only works in a Client Component. To fix, mark the file (or its parent) with the `"use client"` directive.',
    );
  });

  it("should format fetch request error envelope", () => {
    const errorEvent = processErrorEvent(envelopeFetchRequestError);
    const markdown = formatEventOutput(errorEvent);

    expect(errorEvent.platform).toBe("javascript");
    expect(errorEvent.type).toBe("error");

    // Exception, request and breadcrumbs
    expect(errorEvent.entries.length).eq(3);

    expect(markdown).toContain("app/todos/page.tsx");
    expect(markdown).toContain("TypeError: data.map is not a function");
  });
});
