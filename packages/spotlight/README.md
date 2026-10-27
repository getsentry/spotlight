# `@spotlightjs/spotlight`

Spotlight provides a development telemetry UI, a local sidecar, and a desktop app.
Its SDK shares normalization, trace assembly, and insight calculations across
server and frontend consumers. Each instance owns its state; feed server and
frontend instances the same envelope stream and match retention settings when
comparing their retained histories.

## Choose an entry point

| Entry | Factory | Input |
| --- | --- | --- |
| `@spotlightjs/spotlight/sdk/core` | `createIngester()` | Parsed Sentry envelopes in portable runtimes |
| `@spotlightjs/spotlight/sdk/node` | `createPipeline()` | Adds serialized bodies, decompression, and decoded payload history |
| `@spotlightjs/spotlight/sdk` | Existing buffer helpers | Compatibility for existing transport consumers |

## Ingest and read telemetry

Use `@spotlightjs/spotlight/sdk/core` for parsed Sentry envelopes in a browser, worker, or Node application. Use `@spotlightjs/spotlight/sdk/node` for serialized or compressed payloads on Node 20+. Both expose the same processing and read APIs; creating an instance does not start a server. The portable entry has no Node or React dependency. The existing raw-buffer helpers at `/sdk` remain available.

```ts
import { createIngester, serializeSnapshot } from "@spotlightjs/spotlight/sdk/core";

const telemetry = createIngester();
const receipt = await telemetry.ingestEnvelope(parsedEnvelope, {
  deliveryId: "transport-request-123", // Reuse for retries of this delivery.
  signal: abortController.signal,
});
if (receipt.status === "processed") {
  console.log(receipt.envelopeId, receipt.counts, receipt.retained);
} else if (receipt.status === "ignored") {
  console.log(receipt.reason); // For example: duplicate, aborted, queue_full.
} else {
  console.log(receipt.diagnostics); // Literal codes, severity, optional itemIndex/spanIndex.
}
await telemetry.drain();
const json = JSON.stringify(serializeSnapshot(telemetry.getSnapshot()));
telemetry.dispose();
```

The Node adapter accepts `string`, `Uint8Array`, and `Buffer` bodies. `ingestPayload({ body, contentType?, encoding?, userAgent?, deliveryId?, signal? })` decodes `application/x-sentry-envelope` (the default content type) and supports identity, gzip, deflate, and Brotli encoding. Use `getDecodedPayload(envelopeId)` for a copied decompressed payload when it remains in the independently bounded history. Parsed envelopes still use `ingestEnvelope`; the payload methods are `ingestPayload` and `ingestPayloadBatch`.

```ts
import { createPipeline } from "@spotlightjs/spotlight/sdk/node";

const pipeline = createPipeline({ rawBufferSize: 100 });
const receipt = await pipeline.ingestPayload({ body: envelopeBody, deliveryId: "request-1" });
if (receipt.status === "processed") {
  const payload = pipeline.getDecodedPayload(receipt.envelopeId); // Defensive decoded-byte copy.
  const queries = pipeline.getQuerySummaries({ traceId }); // Compact by default.
}
await pipeline.drain();
pipeline.dispose();
```

### Receipts, retries, and lifecycle

Every input returns an immutable receipt with `status`, `diagnostics`, `revision`, `retained`, and `counts`:

| Field | Meaning |
| --- | --- |
| `status: "processed"` | A supported envelope was processed. This does not imply new telemetry or continued retention. |
| `status: "ignored"` | `reason` explains the outcome: `duplicate`, `unsupported_items`, `unsupported_content_type`, `reset`, `disposed`, `aborted`, or `queue_full`. |
| `status: "invalid"` | Diagnostic codes explain invalid data or exceeded payload limits. |
| `retained` | Whether this envelope is in processed retention when the receipt is produced. An unsupported envelope can be retained; an immediately evicted processed envelope is not. This says nothing about Node decoded history. |
| `revision` | Published snapshot revision at the outcome. A retry that changes no state need not advance it. |
| `counts.events`, `counts.spans`, `counts.logs` | Newly added event IDs, trace/span pairs, and log IDs during processing, before retention eviction. These overlap: standalone spans can also become events. They are not retained collection sizes. |
| `counts.skippedItems` | Unsupported wire items plus malformed entries skipped inside supported span containers. |
| `counts.duplicateEvents` | Candidate event observations that did not add a new event ID. Delivery-level duplicate receipts have zero counts. |

Branch on diagnostic `code` and `severity`, or ignored `reason`, rather than message text. Diagnostics can accompany successful partial processing. `itemIndex` and `spanIndex`, when present, are zero-based locations.

Delivery IDs deduplicate only while the corresponding envelope is retained. Eviction and `reset()` permit that delivery again. There is no content hashing: separately allocated envelopes without IDs are separate observations. Reusing the same parsed object or its explicit Spotlight envelope ID preserves its delivery identity within the retained window. Event-ID deduplication is separate from delivery deduplication.

`ingestBatch(iterable, { signal? })` returns receipts in input order and preserves valid neighbors of invalid inputs. It is not a transaction. `ingestPayloadBatch(inputs)` does the same for Node inputs; each input carries its own signal and delivery ID. A batch occupies one queued operation, including while active. Items are copied as they are reached rather than copying the entire batch up front: keep queued batch items unchanged until their receipts resolve. Individual `ingestEnvelope` and `ingestPayload` calls copy their input before the first await. Cancellation returns `ignored/aborted`. `drain()` waits for operations already submitted at the call, excluding future work. `getStats()` reports pending operations, retained envelope count/bytes, revision, and disposal. `subscribe((snapshot, change) => ...)` returns an unsubscribe function; `change` identifies ingest, eviction, reset, or disposal and affected envelope IDs. Release timers and listeners with `dispose()`.

An optional `enrichStacktrace(event, { signal })` hook receives a copied event. Observe its signal to cancel external work. A timeout reports a warning and keeps telemetry; abort, reset, disposal, or timeout prevent late hook writes from entering published state.

### Read APIs and JSON

Accept a `TelemetryReader` from `/sdk/core` in consumers that only query telemetry. Both factories implement it. `createTelemetryReader(getSnapshot)` also constructs a reader over an existing snapshot source. Singular getters such as `getTrace(id)` and `getEvent(id)` return `undefined` when absent; collection getters return readonly arrays. All processed timestamps and durations use milliseconds; time bounds are inclusive Unix milliseconds.

```ts
const queries = reader.getQuerySummaries({ traceId, fromMs, toMs, limit: 10 });
const detailed = reader.getQuerySummaries({ traceId, includeSpans: true });
const first = reader.readPage("events", { traceId, limit: 100, order: "desc" });
if (first.status === "ok" && first.nextCursor) {
  const next = reader.readPage("events", {
    traceId, limit: 100, order: "desc", cursor: first.nextCursor,
  });
  // Handle next.status === "invalid" before using next.items.
}
```

Queries and resource summaries omit full span lists by default; opt in with `includeSpans: true`. Getters accept `fromMs`, `toMs`, `order` (`asc` by default), and a positive `limit`; getters have no implicit limit. Chronological ties use stable IDs. Summary rows sort by description and apply time bounds to their input spans. Invalid getter options throw `RangeError`.

`readPage` supports `events`, `traces`, `logs`, and `spans`, defaults to 100 rows, and caps a page at 1000. It returns `status: "ok"`, `revision`, `items`, `total`, and optional `nextCursor`, or `status: "invalid"` with `invalid_query`, `invalid_cursor`, or `stale_cursor`. Cursors bind the collection, filters, order, limit, and snapshot revision. Keep the query unchanged between pages and restart after a stale cursor. `spanId` filtering on pages is supported for events only. Treat cursors as opaque.

Snapshots preserve readonly maps and sets for in-process use. For JSON, use `serializeSnapshot(snapshot)` or `serializeTrace(trace)`: the schema version is `1`, maps become entry arrays, sets become value arrays, and span trees use IDs and `childSpanIds` instead of repeated object graphs. Unsupported non-wire values or unrelated cycles throw `TypeError`. These DTOs are export formats, not inputs to `ingestEnvelope`. Equivalent reads within the current revision reuse cached results; older snapshots remain stable after subsequent ingestion.

Use `serializeSummaries(reader.getProfileFunctionSummaries())` or pass compact query/resource summaries to export `{ schemaVersion: 1, summaries }`. Profile `traceIds` sets become string arrays. Summaries requested with `includeSpans: true` are rejected at both the type and runtime boundaries; export the complete span graph with `serializeTrace` instead.

### Limits and supported formats

| Option | Default |
| --- | --- |
| `maxPending` (ingestion operations, including active work) | 64 |
| `maxEnvelopeBytes` (serialized parsed envelope) | 32 MiB |
| `enrichmentTimeoutMs` | 5000 ms |
| `retention.maxEnvelopes` / `retention.maxBytes` | 500 / 64 MiB |
| `retention.maxAgeMs` | No age limit; when configured, expires automatically since receipt |
| Node `maxPayloadBytes` / `maxDecodedBytes` | 8 MiB / 32 MiB |
| Node `rawBufferSize` / `maxRawBytes` | 500 / 32 MiB |

Limits must be positive safe integers; Node `rawBufferSize` and `maxRawBytes` also allow zero to disable decoded history. Byte limits use bytes, with 1 MiB = 1024 × 1024 bytes. The Node decoder bounds decompression output. Bound transport collection separately before passing a complete body to the SDK, as shown in the HTTP example. Retention evicts whole envelopes and the telemetry derived from them; the byte budget measures the serialized retained envelopes, not total JavaScript heap size.

`SDK_CAPABILITIES` exposes readonly machine-readable metadata for legacy and v2 spans, profile v1/v2, supported item types, and timestamp units. Supported item types include event/error, transaction, span, log, profile/profile_chunk, feedback, and attachment; individual wire versions can still be unsupported. Portable runtimes need standard JavaScript APIs including `AbortController`, `TextEncoder`, timers, maps, and sets. React is required only by your React consumer; compressed payload decoding is provided by the Node entry.

The [SDK examples](examples/sdk) cover a bounded HTTP server, a frontend transport adapter, a reader-only consumer, React subscription, and an executable lifecycle walkthrough with receipts, retry, partial batches, cancellation, drain, JSON, and paging. After building the Node and UI outputs, run `pnpm test:sdk-types` to typecheck the published declarations and every example, then execute the lifecycle walkthrough. CI runs this check after the package build; it does not add a whole-project TypeScript gate.

### Getter reference

| Read | Result |
| --- | --- |
| `getTrace(traceId)`, `getTraces(filter?)` | Assembled traces |
| `getEvent(eventId)`, `getEvents(filter?)`, `getErrors(filter?)` | Normalized events and captured exceptions |
| `getSpans(filter?)` | Normalized spans |
| `getLog(logId)`, `getLogs(filter?)` | Logs and trace correlation |
| `getQuerySummaries(filter?)` | Database spans grouped by trimmed description |
| `getResourceSummaries(filter?)` | Resource timings and encoded sizes |
| `getProfile(traceId)`, `getProfileFunctionSummaries(filter?)` | Associated profiles and inclusive frame durations/sample counts |
| `getAITraces(filter?)` | AI interactions, tokens, prompts, responses, and tools |
| `getWebVitals(filter?)` | Scored page-load events |
| `getEnvelope(envelopeId)`, `getEnvelopes()` | Retained wire envelopes |
| `getSdks()` | Observed SDK identities |

Event reads accept `traceId` and `spanId`; trace/log/span/profile/summary reads
accept `traceId`; query summaries also accept `description`. The time/order/limit
filters apply to filtered collection reads, not `getEnvelopes()` or `getSdks()`.
Summary fields name units explicitly, including `totalDurationMs`,
`averageDurationMs`, and `averageEncodedSizeBytes`. Stored envelopes retain wire
timestamp units. Caller input is copied; read results are readonly.

`reset()` clears captured data and decoded history, keeps subscriptions, and
invalidates in-flight/queued work. `prune()` explicitly enforces retention.
`dispose()` closes the instance; later ingestion returns `ignored/disposed`.
Eviction rebuilds derived state from retained envelopes, with cost proportional
to retained telemetry. Choose smaller limits for large profiles or heavy streams.

### Examples and compatibility

- [HTTP server](examples/sdk/server.ts): bounded `POST /envelope` input and query summaries at `GET /queries?traceId=...`; call `server.listen(...)` to start it.
- [Frontend adapter](examples/sdk/frontend.ts): one ingester per telemetry view; dispose it when the view disconnects.
- [Reader-only consumer](examples/sdk/reader.ts): filtered queries, JSON serialization, and bounded page traversal.
- [React query list](examples/sdk/react.tsx): `useSyncExternalStore` using a reader and subscription, with no ingestion methods exposed to the view.
- [Executable lifecycle walkthrough](examples/sdk/lifecycle.ts): checked and run by `pnpm test:sdk-types` after the package build.

Snapshots retain the same identity until a committed update, suitable for
`useSyncExternalStore`. Subscribers see coherent snapshots; a failing subscriber
or diagnostic observer cannot break ingestion. Released `createSpotlightBuffer`,
`pushToSpotlightBuffer`, and `decompressBody` remain available from `/sdk` with
their existing behavior. Raw buffering alone does not invoke processing.

Pruning uses one coalesced control operation outside ingestion admission; it remains part of the drain barrier.
