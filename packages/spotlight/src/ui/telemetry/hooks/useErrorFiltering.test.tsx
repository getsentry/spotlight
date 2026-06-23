import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SentryErrorEvent } from "../types";
import useErrorFiltering from "./useErrorFiltering";

function makeError(overrides: Partial<SentryErrorEvent> & { type: string; value: string }): SentryErrorEvent {
  const { type, value, ...rest } = overrides;
  return {
    event_id: `${type}-${value}`,
    timestamp: 0,
    exception: { values: [{ type, value }], value: undefined },
    ...rest,
  } as SentryErrorEvent;
}

const events: SentryErrorEvent[] = [
  makeError({ type: "TypeError", value: "cannot read x", level: "error" }),
  makeError({ type: "RangeError", value: "index out of bounds", level: "warning" }),
  makeError({ type: "TypeError", value: "undefined is not a function", level: "fatal" }),
];

describe("useErrorFiltering", () => {
  it("returns all events when there is no query or filter", () => {
    const { result } = renderHook(() => useErrorFiltering(events, [], ""));
    expect(result.current.filteredEvents).toHaveLength(3);
  });

  it("builds level and exception type options namespaced by dimension", () => {
    const { result } = renderHook(() => useErrorFiltering(events, [], ""));
    const { ERROR_FILTER_CONFIGS } = result.current;
    expect(ERROR_FILTER_CONFIGS.level.options.map(o => o.value).sort()).toEqual([
      "level:error",
      "level:fatal",
      "level:warning",
    ]);
    expect(ERROR_FILTER_CONFIGS.type.options.map(o => o.value).sort()).toEqual(["type:RangeError", "type:TypeError"]);
  });

  it("filters by exception type", () => {
    const { result } = renderHook(() => useErrorFiltering(events, ["type:TypeError"], ""));
    expect(result.current.filteredEvents).toHaveLength(2);
  });

  it("filters by level", () => {
    const { result } = renderHook(() => useErrorFiltering(events, ["level:fatal"], ""));
    expect(result.current.filteredEvents.map(e => e.event_id)).toEqual(["TypeError-undefined is not a function"]);
  });

  it("keeps level and type independent when a value exists in both", () => {
    // An exception type that collides with a level string: selecting the type
    // must not also constrain the level dimension.
    const overlap = [
      makeError({ type: "error", value: "type literally named error", level: "fatal" }),
      makeError({ type: "TypeError", value: "other", level: "error" }),
    ];
    const { result } = renderHook(() => useErrorFiltering(overlap, ["type:error"], ""));
    expect(result.current.filteredEvents.map(e => e.event_id)).toEqual(["error-type literally named error"]);
  });

  it("matches the search query against exception type and value", () => {
    const { result } = renderHook(() => useErrorFiltering(events, [], "out of bounds"));
    expect(result.current.filteredEvents.map(e => e.event_id)).toEqual(["RangeError-index out of bounds"]);
  });

  it("combines level filter and search query", () => {
    const { result } = renderHook(() => useErrorFiltering(events, ["level:error"], "cannot"));
    expect(result.current.filteredEvents).toHaveLength(1);
    const { result: noMatch } = renderHook(() => useErrorFiltering(events, ["level:error"], "out of bounds"));
    expect(noMatch.current.filteredEvents).toHaveLength(0);
  });

  it("hides filter configs when there are no options", () => {
    const withoutLevel = [makeError({ type: "Error", value: "boom" })];
    const { result } = renderHook(() => useErrorFiltering(withoutLevel, [], ""));
    expect(result.current.ERROR_FILTER_CONFIGS.level.show).toBe(false);
    expect(result.current.ERROR_FILTER_CONFIGS.type.show).toBe(true);
  });
});
