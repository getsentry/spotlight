import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import type { SpanData, TraceData } from "../../lib/types";
import { TraceItem } from "../trace-item";

const createMockTrace = (overrides: Partial<TraceData> = {}): TraceData => ({
  trace_id: "abc123def456",
  start_timestamp: Date.now() - 60000, // 1 minute ago
  timestamp: Date.now() - 59000, // 59 seconds ago (1 second duration)
  status: "ok",
  spans: new Map<string, SpanData>(),
  spanTree: [],
  rootTransactionName: "/api/users",
  rootTransactionMethod: "GET",
  ...overrides,
});

describe("TraceItem", () => {
  it("renders trace ID truncated to 8 characters", () => {
    const trace = createMockTrace({ trace_id: "abc123def456ghi789" });

    render(<TraceItem trace={trace} />);

    expect(screen.getByText("abc123de")).toBeInTheDocument();
  });

  it("renders transaction name and method", () => {
    const trace = createMockTrace({
      rootTransactionName: "/api/users/:id",
      rootTransactionMethod: "POST",
    });

    render(<TraceItem trace={trace} />);

    expect(screen.getByText("/api/users/:id")).toBeInTheDocument();
    expect(screen.getByText("POST")).toBeInTheDocument();
  });

  it("renders environment badge when present", () => {
    const trace = createMockTrace({ environment: "production" });

    render(<TraceItem trace={trace} />);

    expect(screen.getByText("production")).toBeInTheDocument();
  });

  it("renders span count", () => {
    const spans = new Map<string, SpanData>();
    spans.set("span-1", {
      span_id: "span-1",
      start_timestamp: 1000,
      timestamp: 1500,
    });
    spans.set("span-2", {
      span_id: "span-2",
      start_timestamp: 1100,
      timestamp: 1400,
    });

    const trace = createMockTrace({ spans });

    render(<TraceItem trace={trace} />);

    expect(screen.getByText("2 spans")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    const trace = createMockTrace();

    render(<TraceItem trace={trace} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(trace.trace_id, trace);
  });

  it("calls onSelect when Enter key is pressed", () => {
    const onSelect = vi.fn();
    const trace = createMockTrace();

    render(<TraceItem trace={trace} onSelect={onSelect} />);

    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(trace.trace_id, trace);
  });

  it("applies selected styling when isSelected is true", () => {
    const trace = createMockTrace();

    render(<TraceItem trace={trace} isSelected />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-muted");
  });

  it("shows success indicator for ok status", () => {
    const trace = createMockTrace({ status: "ok" });

    render(<TraceItem trace={trace} />);

    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("shows error indicator for error status", () => {
    const trace = createMockTrace({ status: "error" });

    render(<TraceItem trace={trace} />);

    // Should show the status badge
    expect(screen.getByText("ERROR")).toBeInTheDocument();
  });

  it("renders duration formatted correctly", () => {
    const trace = createMockTrace({
      start_timestamp: 1000,
      timestamp: 2500, // 1.5 second duration
    });

    render(<TraceItem trace={trace} />);

    expect(screen.getByText("1.5s")).toBeInTheDocument();
  });

  it("renders duration in milliseconds for short spans", () => {
    const trace = createMockTrace({
      start_timestamp: 1000,
      timestamp: 1500, // 500ms duration
    });

    render(<TraceItem trace={trace} />);

    expect(screen.getByText("500ms")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const trace = createMockTrace();

    render(<TraceItem trace={trace} className="custom-class" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("renders without method badge when method is not provided", () => {
    const trace = createMockTrace({
      rootTransactionMethod: undefined,
    });

    render(<TraceItem trace={trace} />);

    expect(screen.queryByText("GET")).not.toBeInTheDocument();
    expect(screen.queryByText("POST")).not.toBeInTheDocument();
  });

  it("renders without environment badge when environment is not provided", () => {
    const trace = createMockTrace({
      environment: undefined,
    });

    render(<TraceItem trace={trace} />);

    // Only the trace ID and transaction name should be present, not environment badge
    expect(screen.getByText("abc123de")).toBeInTheDocument();
    expect(screen.queryByText("production")).not.toBeInTheDocument();
    expect(screen.queryByText("development")).not.toBeInTheDocument();
  });
});
