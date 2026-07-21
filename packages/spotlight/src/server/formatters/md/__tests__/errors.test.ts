import { describe, expect, it } from "vitest";
import { processErrorEvent } from "../errors.ts";

// Regression tests for Python (and other) SDKs that emit ISO 8601 string
// timestamps. formatTimestamp used to multiply these by 1000, producing NaN,
// which threw "Invalid time value" from processErrorEvent. In search_errors
// that throw was swallowed per-envelope, so Python errors silently vanished.
describe("processErrorEvent", () => {
  const baseEvent = {
    event_id: "abc123",
    exception: { values: [{ type: "ValueError", value: "boom" }] },
    message: "boom",
  };

  it("handles ISO 8601 string timestamps (Python SDK) without throwing", () => {
    expect(() => processErrorEvent({ ...baseEvent, timestamp: "2023-11-22T16:23:50.406684Z" })).not.toThrow();

    const result = processErrorEvent({ ...baseEvent, timestamp: "2023-11-22T16:23:50.406684Z" });
    expect(result.dateCreated).toBe("2023-11-22T16:23:50.406Z");
  });

  it("handles numeric Unix-seconds timestamps (JavaScript SDK)", () => {
    const result = processErrorEvent({ ...baseEvent, timestamp: 1700660724.334 });
    expect(result.dateCreated).toBe("2023-11-22T13:45:24.334Z");
  });
});
