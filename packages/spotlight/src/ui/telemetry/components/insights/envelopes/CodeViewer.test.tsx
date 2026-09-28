import { describe, expect, it } from "vitest";
import { extractHighlights } from "./CodeViewer";

describe("extractHighlights", () => {
  it("returns the code unchanged when there are no markers", () => {
    const code = "const a = 1;\nconst b = 2;";
    expect(extractHighlights(code)).toEqual({ source: code, highlighted: [] });
  });

  it("strips a [!code highlight] marker and records the 1-based line", () => {
    const { source, highlighted } = extractHighlights("const a = 1;\nconst b = 2; // [!code highlight]\nconst c = 3;");
    expect(source).toBe("const a = 1;\nconst b = 2;\nconst c = 3;");
    expect(highlighted).toEqual([2]);
  });

  it("handles multiple markers across the snippet", () => {
    const { source, highlighted } = extractHighlights("a // [!code highlight]\nb\nc // [!code highlight]");
    expect(source).toBe("a\nb\nc");
    expect(highlighted).toEqual([1, 3]);
  });

  it("tolerates extra whitespace around the marker", () => {
    const { source, highlighted } = extractHighlights("x = 1;   //   [!code highlight]   ");
    expect(source).toBe("x = 1;");
    expect(highlighted).toEqual([1]);
  });

  it("leaves a bare comment that is not the marker untouched", () => {
    const code = "const a = 1; // just a comment";
    expect(extractHighlights(code)).toEqual({ source: code, highlighted: [] });
  });
});
