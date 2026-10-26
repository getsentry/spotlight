import type { Telemetry } from "@spotlightjs/spotlight/sdk/core";
import { useSyncExternalStore } from "react";

export function QueryList({ telemetry, traceId }: { telemetry: Telemetry; traceId?: string }) {
  useSyncExternalStore(telemetry.subscribe, telemetry.getSnapshot, telemetry.getSnapshot);
  const queries = telemetry.getQuerySummaries({ traceId });
  return (
    <ul>
      {queries.map(query => (
        <li key={query.description}>
          {query.description}: {query.count} calls, {query.totalDurationMs}ms total, {query.averageDurationMs}ms average
        </li>
      ))}
    </ul>
  );
}
