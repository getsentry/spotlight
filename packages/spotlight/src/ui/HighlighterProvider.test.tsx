import { describe, expect, it } from "vitest";
import { resolveLanguage } from "./HighlighterProvider";

describe("resolveLanguage", () => {
  it("maps canonical language names to themselves", () => {
    expect(resolveLanguage("javascript")).toBe("javascript");
    expect(resolveLanguage("typescript")).toBe("typescript");
    expect(resolveLanguage("python")).toBe("python");
    expect(resolveLanguage("rust")).toBe("rust");
  });

  it("maps file-extension and platform aliases", () => {
    expect(resolveLanguage("js")).toBe("javascript");
    expect(resolveLanguage("jsx")).toBe("javascript");
    expect(resolveLanguage("node")).toBe("javascript");
    expect(resolveLanguage("ts")).toBe("typescript");
    expect(resolveLanguage("tsx")).toBe("typescript");
    expect(resolveLanguage("py")).toBe("python");
    expect(resolveLanguage("rs")).toBe("rust");
    expect(resolveLanguage("golang")).toBe("go");
  });

  it("is case-insensitive", () => {
    expect(resolveLanguage("JavaScript")).toBe("javascript");
    expect(resolveLanguage("PY")).toBe("python");
  });

  it("returns null for languages without a twinkleplop grammar", () => {
    // These route to the shiki fallback (java) or the plain-text fallback.
    expect(resolveLanguage("java")).toBeNull();
    expect(resolveLanguage("text")).toBeNull();
    expect(resolveLanguage("")).toBeNull();
  });
});
