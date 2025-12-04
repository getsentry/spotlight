import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import AnsiText from "./AnsiText";

describe("AnsiText", () => {
  it("should render plain text without ANSI codes", () => {
    const { container } = render(<AnsiText text="Hello World" />);
    expect(container.textContent).toBe("Hello World");
  });

  it("should render green text with inline style", () => {
    // Store in variable to avoid JSX attribute double-escaping issue
    const ansiText = "\u001b[32mGreen text\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Green text");
    // Check that a color is applied via inline style (Sentinel green: #83da90)
    const spans = container.querySelectorAll("span");
    const greenSpan = Array.from(spans).find(s => s instanceof HTMLElement && s.style.color !== "");
    expect(greenSpan).toBeDefined();
    expect((greenSpan as HTMLElement).style.color).toMatch(/83da90|rgb\(131,\s*218,\s*144\)/i);
  });

  it("should render red text with inline style", () => {
    const ansiText = "\u001b[31mRed text\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Red text");
    // Check that a color is applied via inline style (Sentinel red: #fe4144)
    const spans = container.querySelectorAll("span");
    const redSpan = Array.from(spans).find(s => s instanceof HTMLElement && s.style.color !== "");
    expect(redSpan).toBeDefined();
    expect((redSpan as HTMLElement).style.color).toMatch(/fe4144|rgb\(254,\s*65,\s*68\)/i);
  });

  it("should render bold text with default color", () => {
    const ansiText = "\u001b[1mBold text\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Bold text");
    const spans = container.querySelectorAll("span");
    const boldSpan = Array.from(spans).find(s => s.className.includes("font-bold"));
    expect(boldSpan).toBeDefined();
    // Bold text without explicit color should still get default text color
    expect(boldSpan?.className).toContain("text-primary-300");
  });

  it("should render italic text with default color", () => {
    const ansiText = "\u001b[3mItalic text\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Italic text");
    const spans = container.querySelectorAll("span");
    const italicSpan = Array.from(spans).find(s => s.className.includes("italic"));
    expect(italicSpan).toBeDefined();
    // Italic text without explicit color should still get default text color
    expect(italicSpan?.className).toContain("text-primary-300");
  });

  it("should render bold+italic text with default color", () => {
    const ansiText = "\u001b[1;3mBold and italic\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Bold and italic");
    const spans = container.querySelectorAll("span");
    const styledSpan = Array.from(spans).find(s => s.className.includes("font-bold") && s.className.includes("italic"));
    expect(styledSpan).toBeDefined();
    // Formatted text without explicit color should get default text color
    expect(styledSpan?.className).toContain("text-primary-300");
  });

  it("should render multiple colors and styles", () => {
    const ansiText = "\u001b[32mGreen\u001b[0m \u001b[31mRed\u001b[0m \u001b[1mBold\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Green Red Bold");

    // Check that multiple spans are created
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBeGreaterThan(1);

    // Should have spans with colors (inline styles)
    const coloredSpans = Array.from(spans).filter(s => s instanceof HTMLElement && s.style.color !== "");
    expect(coloredSpans.length).toBeGreaterThanOrEqual(2);

    // Bold uses Tailwind class
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

  it("should render cyan text with correct color (not magenta)", () => {
    const ansiText = "\u001b[36mCyan text\u001b[0m";
    const { container } = render(<AnsiText text={ansiText} />);
    const text = container.textContent;
    expect(text).toBe("Cyan text");
    // Check that cyan color is applied (Sentinel cyan: #22D3EE)
    const spans = container.querySelectorAll("span");
    const cyanSpan = Array.from(spans).find(s => s instanceof HTMLElement && s.style.color !== "");
    expect(cyanSpan).toBeDefined();
    // Should be cyan (#22D3EE), NOT magenta (#FF45A8)
    expect((cyanSpan as HTMLElement).style.color).toMatch(/22d3ee|rgb\(34,\s*211,\s*238\)/i);
    expect((cyanSpan as HTMLElement).style.color).not.toMatch(/ff45a8|rgb\(255,\s*69,\s*168\)/i);
  });
});
