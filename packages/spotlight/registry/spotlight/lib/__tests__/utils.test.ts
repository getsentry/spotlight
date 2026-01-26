import { describe, expect, it } from "vitest";
import { cn, truncateId } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", true && "bar")).toBe("foo bar");
    expect(cn("foo", false && "bar")).toBe("foo");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("handles arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("merges Tailwind classes correctly", () => {
    // tailwind-merge should dedupe conflicting classes
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("preserves non-conflicting classes", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn("", "")).toBe("");
  });
});

describe("truncateId", () => {
  it("truncates long IDs to 8 characters by default", () => {
    expect(truncateId("abc123def456ghi789")).toBe("abc123de");
  });

  it("truncates to custom length", () => {
    expect(truncateId("abc123def456ghi789", 4)).toBe("abc1");
    expect(truncateId("abc123def456ghi789", 12)).toBe("abc123def456");
  });

  it("returns full string if shorter than length", () => {
    expect(truncateId("abc")).toBe("abc");
    expect(truncateId("abcde", 10)).toBe("abcde");
  });

  it("handles empty string", () => {
    expect(truncateId("")).toBe("");
  });

  it("handles undefined with default value", () => {
    expect(truncateId(undefined)).toBe("");
    expect(truncateId()).toBe("");
  });

  it("handles exact length strings", () => {
    expect(truncateId("abcdefgh")).toBe("abcdefgh");
    expect(truncateId("abcd", 4)).toBe("abcd");
  });
});
