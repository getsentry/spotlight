import type { TelemetryReader, TelemetryStore } from "@spotlightjs/spotlight/sdk/core";
import { useSyncExternalStore } from "react";

type Props = {
  reader: TelemetryReader;
  subscribe: TelemetryStore["subscribe"];
  traceId?: string;
};

/** Pass reader={ingester} subscribe={ingester.subscribe}; the view cannot ingest or reset. */
export function QueryList({ reader, subscribe, traceId }: Props) {
  useSyncExternalStore(subscribe, reader.getSnapshot, reader.getSnapshot);
  const queries = reader.getDatabaseQuerySummaries({ traceId });
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
