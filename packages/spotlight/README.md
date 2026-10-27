# `@spotlightjs/spotlight`

Spotlight provides a development telemetry UI, a local sidecar, and a desktop app.
Its SDK shares the same normalization, trace assembly, and insight calculations
across server and frontend consumers.

## Choose an entry point

| Entry | Factory | Input |
| --- | --- | --- |
| `@spotlightjs/spotlight/sdk/core` | `createIngester()` | Parsed Sentry envelopes; portable across server and frontend |
| `@spotlightjs/spotlight/sdk/node` | `createPipeline()` | Adds serialized bodies, decompression, and raw payload history |
| `@spotlightjs/spotlight/sdk` | Existing buffer helpers | Compatibility for existing transport consumers |

`createIngester()` runs on the frontend or server with parsed envelopes.
`createPipeline()` requires Node APIs for wire decoding and decompression.
Both share all processing and query logic. The core requires no React, DOM,
Node globals, or Zustand knowledge. Each instance owns its state. The SDK does not start a server or synchronize instances; feed
server and frontend instances the same envelope stream when both need processing.
Match retention settings when comparing their retained histories.

## Server: receive envelopes and read insights

```ts
import { createPipeline } from "@spotlightjs/spotlight/sdk/node";

const pipeline = createPipeline({
  rawBufferSize: 100,
  retention: { maxEnvelopes: 1000, maxAgeMs: 10 * 60 * 1000 },
});

const result = await pipeline.ingest({
  body: Buffer.from(envelopeBody),
  // Defaults to application/x-sentry-envelope.
  // contentType: request.headers["content-type"],
  // encoding: request.headers["content-encoding"], // identity, gzip, deflate, br
  // userAgent: request.headers["user-agent"],
});

if (result.status === "invalid") {
  console.error(result.diagnostics);
} else if (result.status === "processed") {
  const trace = pipeline.getTrace(traceId);
  const queries = pipeline.getQuerySummaries({ traceId });
  const raw = pipeline.getRawPayload(result.envelopeId); // defensive byte copy
}
```

See [the HTTP server example](examples/sdk/server.ts), which receives envelopes
at `POST /envelope` and serves query summaries at `GET /queries?traceId=...`.
Call `server.listen(...)` to start that example; closing it disposes its SDK instance.

## Frontend: process the same stream

```ts
import { createIngester } from "@spotlightjs/spotlight/sdk/core";

const ingester = createIngester();

// Your SSE/WebSocket handler supplies parsed envelopes.
await ingester.ingestEnvelope(parsedEnvelope);

const queries = ingester.getQuerySummaries({ traceId });
// [{ description, count, totalDurationMs, averageDurationMs, spans }]
const logs = ingester.getLogs({ traceId });
const spans = ingester.getSpans({ traceId });
```

See [the frontend lifecycle example](examples/sdk/frontend.ts). Create an instance
once for the view or application, then call `dispose()` when it is no longer needed.

## React: subscribe to completed snapshots

```tsx
import { useSyncExternalStore } from "react";
import type { Ingester } from "@spotlightjs/spotlight/sdk/core";

function TraceCount({ ingester }: { ingester: Ingester }) {
  const snapshot = useSyncExternalStore(
    ingester.subscribe,
    ingester.getSnapshot,
    ingester.getSnapshot,
  );
  return <span>{snapshot.traces.length} traces</span>;
}
```

See [the React query-list example](examples/sdk/react.tsx). Snapshots keep the same
identity until a committed update, making them suitable for `useSyncExternalStore`.
The core never exposes a writable store or requires a React adapter dependency.

## Reads and units

Collection reads accept filters; singular reads accept an identity.

| Read | Result |
| --- | --- |
| `getTrace(traceId)`, `getTraces({ traceId? })` | Assembled traces |
| `getEvent(eventId)`, `getEvents({ traceId?, spanId? })` | Normalized events |
| `getErrors({ traceId?, spanId? })` | Captured exception events |
| `getSpans({ traceId? })` | Normalized spans |
| `getLog(logId)`, `getLogs({ traceId? })` | Logs and trace correlation |
| `getQuerySummaries({ traceId?, description? })` | Database spans grouped by trimmed description |
| `getResourceSummaries({ traceId? })` | Resource timings and encoded sizes |
| `getProfile(traceId)` | Associated V1 or continuous profile |
| `getProfileFunctionSummaries({ traceId? })` | Inclusive frame durations and sample counts |
| `getAITraces({ traceId? })` | AI interactions, tokens, prompts, responses, tools |
| `getWebVitals()` | Scored page-load events |
| `getEnvelope(envelopeId)`, `getEnvelopes()` | Retained wire envelopes |
| `getSdks()` | Observed SDK identities |

Normalized event/span timestamps are Unix **milliseconds**. Summary fields name
units explicitly: `totalDurationMs`, `averageDurationMs`, `averageEncodedSizeBytes`.
Stored envelopes retain wire timestamp units. Parsed attachment strings and bytes
use the same `{ data }` representation as the Node decoder: UTF-8 for text content
types, base64 for binary data. Internal envelope metadata is added to the stored
copy. Caller input is never mutated. Telemetry reads return read-only snapshots,
arrays, objects, maps, and sets; copy data when you need to edit it.

## Ingestion results and diagnostics

Both factories return the same discriminated result from ingestion:

- `processed`: accepted telemetry, with `envelopeId` and `diagnostics`.
- `ignored`: `reason` explains a duplicate, unsupported item/media type, reset, or
  disposed instance. Valid unsupported-only envelopes are retained for inspection
  and include `envelopeId`.
- `invalid`: malformed input or decompression failure, with `diagnostics`.

Mixed span batches retain valid spans and report skipped malformed spans. Supply
`onDiagnostic(diagnostic)` to observe diagnostics, or inspect each ingestion result.
Optional `enrichStacktrace: async event => { ... }` adds source context without
requiring a context-lines server. Enrichment failure retains the captured error.

Ingestion resolves after processing/enrichment. Each committed envelope produces
one coherent subscription update; duplicate or invalid input produces none unless
retention also removes expired data. Subscribers can read new raw Node payloads
at that same update. A subscriber or diagnostic observer cannot break ingestion.

## Retention and lifecycle

- Processed retention defaults to **500 envelopes**, including telemetry derived
  from them. Set `retention.maxEnvelopes` to another positive integer.
- Optional `retention.maxAgeMs` measures age since receipt. Expiration runs while
  idle, and `await ingester.prune()` can enforce limits explicitly.
- Eviction rebuilds derived state from retained envelopes so traces, logs, profiles,
  and insights stay consistent. Enrichment is reused; generated IDs remain stable.
  Rebuilding costs CPU proportional to retained telemetry; use smaller limits for
  large profiles or high-volume streams.
- Node raw history is independently bounded by `rawBufferSize` (default **500**;
  **0** disables it). Raw bytes can outlive processed retention and are copied on read.
- `reset()` clears captured data and raw history, preserves subscriptions, and
  invalidates in-flight/queued work. The instance remains usable.
- `dispose()` clears captured data, releases timers and subscriptions, invalidates
  pending work, and closes the instance. Later ingestion returns `ignored/disposed`.
- Stable envelope/event/log/span IDs deduplicate delivery. Reusing an idless parsed
  envelope object also deduplicates it. Distinct idless log envelopes are separate
  observations, even when their content matches.

## Compatibility and migration

Released `createSpotlightBuffer`, `pushToSpotlightBuffer`, and `decompressBody`
exports remain available from `/sdk` with their existing behavior. Raw buffering
alone does not invoke processing. Use `/sdk/core` and `/sdk/node` for the new
processing API. Its factory and type names are independent of the package name,
so moving the package later only requires changing import paths.
