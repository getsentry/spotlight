import { type IngestOptions, createTelemetryStore } from "@spotlightjs/spotlight/sdk/core";

/** Keep one instance for the lifetime of the telemetry view. */
export function createFrontendTelemetry() {
  const ingester = createTelemetryStore({ retention: { maxEnvelopes: 500 } });
  return {
    ingester,
    // Pass the parsed envelopes received over SSE, WebSocket, or your own transport.
    receiveEnvelope: (envelope: unknown, options?: IngestOptions) => ingester.ingestEnvelope(envelope, options),
    disconnect: ingester.dispose,
  };
}
