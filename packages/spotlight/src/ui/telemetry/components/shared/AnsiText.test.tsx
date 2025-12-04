import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import AnsiText from "./AnsiText";

describe("AnsiText", () => {
  it("should render plain text without ANSI codes", () => {
    const { container } = render(<AnsiText text="Hello World" />);
    expect(container.textContent).toBe("Hello World");
  });

  it("should render green text", () => {
    // Store in variable to avoid JSX attribute double-escaping issue
    const ansiText = "\u001b[32mGreen text\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Green text");
    // Check that the green color class is applied
    const spans = container.querySelectorAll("span");
    const greenSpan = Array.from(spans).find(s => s.className.includes("text-green-400"));
    expect(greenSpan).toBeDefined();
  });

  it("should render red text", () => {
    const ansiText = "\u001b[31mRed text\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Red text");
    const spans = container.querySelectorAll("span");
    const redSpan = Array.from(spans).find(s => s.className.includes("text-red-400"));
    expect(redSpan).toBeDefined();
  });

  it("should render bold text", () => {
    const ansiText = "\u001b[1mBold text\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Bold text");
    const spans = container.querySelectorAll("span");
    const boldSpan = Array.from(spans).find(s => s.className.includes("font-bold"));
    expect(boldSpan).toBeDefined();
  });

  it("should render italic text", () => {
    const ansiText = "\u001b[3mItalic text\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Italic text");
    const spans = container.querySelectorAll("span");
    const italicSpan = Array.from(spans).find(s => s.className.includes("italic"));
    expect(italicSpan).toBeDefined();
  });

  it("should render multiple colors and styles", () => {
    const ansiText = "\u001b[32mGreen\u001b[0m \u001b[31mRed\u001b[0m \u001b[1mBold\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Green Red Bold");

    // Check that multiple spans are created with different classes
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBeGreaterThan(1);

    // Should have spans with respective classes
    const greenSpan = Array.from(spans).find(s => s.className.includes("text-green-400"));
    expect(greenSpan).toBeDefined();
    const redSpan = Array.from(spans).find(s => s.className.includes("text-red-400"));
    expect(redSpan).toBeDefined();
    const boldSpan = Array.from(spans).find(s => s.className.includes("font-bold"));
    expect(boldSpan).toBeDefined();
  });

  it("should handle empty text", () => {
    const { container } = render(<AnsiText text="" />);
    expect(container.textContent).toBe("");
  });

  it("should apply custom className", () => {
    const { container } = render(<AnsiText text="Test" className="custom-class" />);
    const outerSpan = container.querySelector("span");
    expect(outerSpan?.className).toContain("custom-class");
  });

  it("should render complex ANSI sequences like the test fixture", () => {
    const testText =
      "\u001b[32m✓\u001b[0m \u001b[1mSuccessfully connected\u001b[0m to database \u001b[36musers\u001b[0m";
    const { container } = render(<AnsiText text={testText} />);
    const text = container.textContent;
    expect(text).toContain("✓");
    expect(text).toContain("Successfully connected");
    expect(text).toContain("users");

    // Should not contain raw escape sequences
    expect(text).not.toContain("\u001b[");
    expect(text).not.toContain("\\u001b");
  });
});
