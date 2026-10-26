import { createTelemetry } from "@spotlightjs/spotlight/sdk/core";

/** Keep one instance for the lifetime of the telemetry view. */
export function createFrontendTelemetry() {
  const telemetry = createTelemetry({ retention: { maxEnvelopes: 500 } });
  return {
    telemetry,
    // Pass the parsed envelopes received over SSE, WebSocket, or your own transport.
    receiveEnvelope: (envelope: unknown) => telemetry.ingestEnvelope(envelope),
    disconnect: telemetry.dispose,
  };
}
