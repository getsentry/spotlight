import type { Ingester } from "@spotlightjs/spotlight/sdk/core";
import { useSyncExternalStore } from "react";

export function QueryList({ ingester, traceId }: { ingester: Ingester; traceId?: string }) {
  useSyncExternalStore(ingester.subscribe, ingester.getSnapshot, ingester.getSnapshot);
  const queries = ingester.getQuerySummaries({ traceId });
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
