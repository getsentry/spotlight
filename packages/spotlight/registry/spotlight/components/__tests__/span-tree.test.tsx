import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import type { SpanData } from "../../lib/types";
import { SpanTree } from "../span-tree";

const createMockSpan = (overrides: Partial<SpanData> = {}): SpanData => ({
  span_id: "span-1",
  trace_id: "trace-1",
  op: "http.request",
  description: "GET /api/users",
  start_timestamp: 1000,
  timestamp: 1500,
  status: "ok",
  children: [],
  ...overrides,
});

describe("SpanTree", () => {
  it("renders nothing when spans array is empty", () => {
    const { container } = render(<SpanTree spans={[]} traceStartTimestamp={1000} traceDuration={1000} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single span", () => {
    const span = createMockSpan();

    render(<SpanTree spans={[span]} traceStartTimestamp={1000} traceDuration={1000} />);

    expect(screen.getByText("http.request")).toBeInTheDocument();
    expect(screen.getByText("GET /api/users")).toBeInTheDocument();
  });

  it("renders multiple root spans", () => {
    const spans: SpanData[] = [
      createMockSpan({ span_id: "span-1", op: "http.request" }),
      createMockSpan({ span_id: "span-2", op: "db.query" }),
    ];

    render(<SpanTree spans={spans} traceStartTimestamp={1000} traceDuration={1000} />);

    expect(screen.getByText("http.request")).toBeInTheDocument();
    expect(screen.getByText("db.query")).toBeInTheDocument();
  });

  it("calls onSpanSelect when span is clicked", () => {
    const onSpanSelect = vi.fn();
    const span = createMockSpan();

    render(<SpanTree spans={[span]} traceStartTimestamp={1000} traceDuration={1000} onSpanSelect={onSpanSelect} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onSpanSelect).toHaveBeenCalledWith("span-1", span);
  });

  it("highlights selected span", () => {
    const span = createMockSpan();

    render(<SpanTree spans={[span]} traceStartTimestamp={1000} traceDuration={1000} selectedSpanId="span-1" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-muted");
  });

  it("highlights spans in highlightedSpanIds", () => {
    const span = createMockSpan();
    const highlightedSpanIds = new Set(["span-1"]);

    render(
      <SpanTree
        spans={[span]}
        traceStartTimestamp={1000}
        traceDuration={1000}
        highlightedSpanIds={highlightedSpanIds}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary/10");
  });

  it("renders nested spans with children", () => {
    const parentSpan = createMockSpan({
      span_id: "parent",
      op: "http.request",
      children: [
        createMockSpan({
          span_id: "child-1",
          op: "db.query",
          parent_span_id: "parent",
        }),
      ],
    });

    render(<SpanTree spans={[parentSpan]} traceStartTimestamp={1000} traceDuration={1000} />);

    expect(screen.getByText("http.request")).toBeInTheDocument();
    expect(screen.getByText("db.query")).toBeInTheDocument();
  });

  it("displays duration in correct format", () => {
    const span = createMockSpan({
      start_timestamp: 1000,
      timestamp: 1500, // 500ms duration
    });

    render(<SpanTree spans={[span]} traceStartTimestamp={1000} traceDuration={1000} />);

    expect(screen.getByText("500ms")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const span = createMockSpan();

    const { container } = render(
      <SpanTree spans={[span]} traceStartTimestamp={1000} traceDuration={1000} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("shows error styling for error status", () => {
    const span = createMockSpan({ status: "error" });

    render(<SpanTree spans={[span]} traceStartTimestamp={1000} traceDuration={1000} />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-destructive");
  });
});
