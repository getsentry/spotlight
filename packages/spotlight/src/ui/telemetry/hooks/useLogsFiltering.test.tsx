import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SentryLogEventItem } from "../types";
import useLogsFiltering from "./useLogsFiltering";

function makeLog(level: string, body: string, logger?: string): SentryLogEventItem {
  return {
    id: `${level}-${body}`,
    timestamp: 0,
    severity_number: 0,
    sdk: undefined,
    level,
    body,
    attributes: logger ? { "sentry.logger.name": { value: logger, type: "string" } } : undefined,
  } as unknown as SentryLogEventItem;
}

const logs: SentryLogEventItem[] = [
  makeLog("info", "user logged in", "auth"),
  makeLog("error", "database connection failed", "db"),
  makeLog("warn", "slow query detected", "db"),
];

describe("useLogsFiltering", () => {
  it("returns all logs with no query or filter", () => {
    const { result } = renderHook(() => useLogsFiltering(logs, [], ""));
    expect(result.current.filteredLogs).toHaveLength(3);
  });

  it("builds severity and logger options", () => {
    const { result } = renderHook(() => useLogsFiltering(logs, [], ""));
    const { LOGS_FILTER_CONFIGS } = result.current;
    expect(LOGS_FILTER_CONFIGS.level.options.map(o => o.value).sort()).toEqual(["error", "info", "warn"]);
    expect(LOGS_FILTER_CONFIGS.logger.options.map(o => o.value).sort()).toEqual(["auth", "db"]);
  });

  it("filters by severity level", () => {
    const { result } = renderHook(() => useLogsFiltering(logs, ["error"], ""));
    expect(result.current.filteredLogs.map(l => l.body)).toEqual(["database connection failed"]);
  });

  it("filters by logger name", () => {
    const { result } = renderHook(() => useLogsFiltering(logs, ["db"], ""));
    expect(result.current.filteredLogs).toHaveLength(2);
  });

  it("matches the search query against the log body", () => {
    const { result } = renderHook(() => useLogsFiltering(logs, [], "query"));
    expect(result.current.filteredLogs.map(l => l.body)).toEqual(["slow query detected"]);
  });

  it("hides the logger filter when no logs carry a logger name", () => {
    const { result } = renderHook(() => useLogsFiltering([makeLog("info", "hi")], [], ""));
    expect(result.current.LOGS_FILTER_CONFIGS.logger.show).toBe(false);
    expect(result.current.LOGS_FILTER_CONFIGS.level.show).toBe(true);
  });
});
