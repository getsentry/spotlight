import { describe, expect, test } from "vitest";
import type { SentryEvent } from "../types";
import { isErrorEvent } from "./sentry";

function event(partial: Record<string, unknown>): SentryEvent {
  return {
    event_id: "evt",
    timestamp: 1,
    ...partial,
  } as SentryEvent;
}

describe("isErrorEvent", () => {
  test("treats a captured message without an exception as an error event", () => {
    expect(
      isErrorEvent(
        event({
          level: "error",
          message: "handled failure",
        }),
      ),
    ).toBe(true);
  });

  test("treats a formatted message on an event payload as an error event", () => {
    expect(
      isErrorEvent(
        event({
          type: "event",
          level: "error",
          message: { formatted: "handled failure" },
        }),
      ),
    ).toBe(true);
  });

  test("still treats exception events as errors", () => {
    expect(
      isErrorEvent(
        event({
          exception: { values: [{ type: "Error", value: "boom" }] },
        }),
      ),
    ).toBe(true);
  });

  test("does not treat transactions or logs as errors", () => {
    expect(isErrorEvent(event({ type: "transaction", message: "GET /" }))).toBe(false);
    expect(isErrorEvent(event({ type: "log", items: [], message: "info" }))).toBe(false);
  });

  test("does not treat an event with neither exception nor message as an error", () => {
    expect(isErrorEvent(event({ level: "error" }))).toBe(false);
  });
});
