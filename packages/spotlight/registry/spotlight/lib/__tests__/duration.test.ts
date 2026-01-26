import { describe, expect, it } from "vitest";
import { DURATION_LABELS, formatDuration, formatNumber, formatSpanDuration, getDurationClassName } from "../duration";

describe("formatNumber", () => {
  it("formats numbers with default 2 decimal places", () => {
    expect(formatNumber(1.5)).toBe("1.5");
    expect(formatNumber(2.456)).toBe("2.46");
    expect(formatNumber(2.0)).toBe("2");
    expect(formatNumber(10.0)).toBe("10");
  });

  it("formats numbers with custom decimal places", () => {
    expect(formatNumber(2.456789, 3)).toBe("2.457");
    expect(formatNumber(2.0, 1)).toBe("2");
    expect(formatNumber(1.5, 0)).toBe("2"); // Rounded
  });

  it("removes trailing .00", () => {
    expect(formatNumber(5.0)).toBe("5");
    expect(formatNumber(100.0)).toBe("100");
  });
});

describe("formatDuration", () => {
  it("formats milliseconds", () => {
    expect(formatDuration(0)).toBe("0ms");
    expect(formatDuration(1)).toBe("1ms");
    expect(formatDuration(500)).toBe("500ms");
    expect(formatDuration(999)).toBe("999ms");
  });

  it("formats seconds", () => {
    expect(formatDuration(1000)).toBe("1s");
    expect(formatDuration(1500)).toBe("1.5s");
    expect(formatDuration(5000)).toBe("5s");
    expect(formatDuration(59999)).toBe("60s"); // Trailing zeros removed
  });

  it("formats minutes", () => {
    expect(formatDuration(60000)).toBe("1min");
    expect(formatDuration(90000)).toBe("1.5min");
    expect(formatDuration(300000)).toBe("5min");
  });

  it("formats hours", () => {
    expect(formatDuration(3600000)).toBe("1hr");
    expect(formatDuration(5400000)).toBe("1.5hr");
  });

  it("formats days", () => {
    expect(formatDuration(86400000)).toBe("1d");
    expect(formatDuration(172800000)).toBe("2d");
  });

  it("formats weeks", () => {
    expect(formatDuration(604800000)).toBe("1wk");
    expect(formatDuration(1209600000)).toBe("2wk");
  });

  it("formats months", () => {
    expect(formatDuration(2629800000)).toBe("1mo");
  });

  it("formats years", () => {
    expect(formatDuration(31557600000)).toBe("1yr");
    expect(formatDuration(63115200000)).toBe("2yr");
  });
});

describe("formatSpanDuration", () => {
  it("calculates and formats span duration", () => {
    expect(
      formatSpanDuration({
        start_timestamp: 1000,
        timestamp: 1500,
      }),
    ).toBe("500ms");
  });

  it("handles zero duration", () => {
    expect(
      formatSpanDuration({
        start_timestamp: 1000,
        timestamp: 1000,
      }),
    ).toBe("0ms");
  });

  it("handles long durations", () => {
    expect(
      formatSpanDuration({
        start_timestamp: 0,
        timestamp: 5000,
      }),
    ).toBe("5s");
  });
});

describe("getDurationClassName", () => {
  it("returns destructive for durations > 1000ms", () => {
    expect(getDurationClassName(1001)).toBe("text-destructive");
    expect(getDurationClassName(5000)).toBe("text-destructive");
    expect(getDurationClassName(10000)).toBe("text-destructive");
  });

  it("returns orange for durations > 500ms", () => {
    expect(getDurationClassName(501)).toBe("text-orange-500");
    expect(getDurationClassName(750)).toBe("text-orange-500");
    expect(getDurationClassName(1000)).toBe("text-orange-500");
  });

  it("returns yellow for durations > 100ms", () => {
    expect(getDurationClassName(101)).toBe("text-yellow-500");
    expect(getDurationClassName(300)).toBe("text-yellow-500");
    expect(getDurationClassName(500)).toBe("text-yellow-500");
  });

  it("returns muted-foreground for durations <= 100ms", () => {
    expect(getDurationClassName(0)).toBe("text-muted-foreground");
    expect(getDurationClassName(50)).toBe("text-muted-foreground");
    expect(getDurationClassName(100)).toBe("text-muted-foreground");
  });
});

describe("DURATION_LABELS", () => {
  it("contains all expected time units", () => {
    expect(DURATION_LABELS[31557600000]).toBe("yr");
    expect(DURATION_LABELS[2629800000]).toBe("mo");
    expect(DURATION_LABELS[604800000]).toBe("wk");
    expect(DURATION_LABELS[86400000]).toBe("d");
    expect(DURATION_LABELS[3600000]).toBe("hr");
    expect(DURATION_LABELS[60000]).toBe("min");
    expect(DURATION_LABELS[1000]).toBe("s");
  });
});
