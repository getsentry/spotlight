import { describe, expect, it } from "vitest";
import { formatTimestamp, getDuration } from "../utils.ts";

describe("formatTimestamp", () => {
  it("formats numeric Unix seconds (JavaScript SDK)", () => {
    expect(formatTimestamp(1700660724.334)).toBe("2023-11-22T13:45:24.334Z");
  });

  it("formats ISO 8601 strings (Python SDK)", () => {
    expect(formatTimestamp("2023-11-22T16:23:50.406684Z")).toBe("2023-11-22T16:23:50.406Z");
  });

  it("formats numeric strings as Unix seconds", () => {
    expect(formatTimestamp("1700660724.334")).toBe("2023-11-22T13:45:24.334Z");
  });

  it("falls back to epoch for missing timestamps", () => {
    expect(formatTimestamp(undefined)).toBe("1970-01-01T00:00:00.000Z");
    expect(formatTimestamp("")).toBe("1970-01-01T00:00:00.000Z");
  });

  it("falls back to epoch for unparseable strings instead of throwing", () => {
    expect(() => formatTimestamp("not-a-date")).not.toThrow();
    expect(formatTimestamp("not-a-date")).toBe("1970-01-01T00:00:00.000Z");
  });
});

describe("getDuration", () => {
  it("computes duration from numeric Unix seconds", () => {
    expect(getDuration(1700660724.5, 1700660724)).toBe(500);
  });

  it("computes duration from numeric strings", () => {
    expect(getDuration("1700660724.5", "1700660724")).toBe(500);
  });

  it("computes duration from ISO 8601 strings (Python SDK)", () => {
    expect(getDuration("2023-11-22T16:23:50.406684Z", "2023-11-22T16:23:49.525798Z")).toBe(881);
  });

  it("returns undefined when a timestamp is missing", () => {
    expect(getDuration(undefined, 1700660724)).toBeUndefined();
    expect(getDuration(1700660724, undefined)).toBeUndefined();
  });

  it("returns undefined for unparseable timestamps", () => {
    expect(getDuration("not-a-date", "also-bad")).toBeUndefined();
  });
});
