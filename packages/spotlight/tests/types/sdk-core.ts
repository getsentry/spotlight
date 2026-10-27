import { type ProcessedEvent, type QuerySummary, createIngester } from "@spotlightjs/spotlight/sdk/core";

const telemetry = createIngester();
const queries: readonly QuerySummary[] = telemetry.getQuerySummaries({ traceId: "trace" });
const events: readonly ProcessedEvent[] = telemetry.getEvents({ traceId: "trace", spanId: "span" });
const envelope = telemetry.getEnvelope("envelope");
if (envelope) {
  const [header, items] = envelope;
  const sdk = header.sdk;
  for (const [itemHeader, payload] of items) {
    const type: string = itemHeader.type;
    void type;
    void payload;
  }
  void sdk;
}
// @ts-expect-error State storage is private.
telemetry.store;
// @ts-expect-error Public events are read-only.
events.push(events[0]);
// @ts-expect-error Nested maps cannot be mutated through the public type.
telemetry.getTrace("trace")?.spans.clear();
// @ts-expect-error Duration units are explicit in the public contract.
queries[0].totalTime;
const normalizedTimestamp: number = events[0].timestamp;
void normalizedTimestamp;
void queries[0].totalDurationMs;
void queries[0].averageDurationMs;
telemetry.dispose();
