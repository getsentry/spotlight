/**
 * Format an envelope containing multiple events.
 * Generic envelope formatter used by all formatters (md, logfmt, json).
 */
export function formatEnvelopeWithFormatter(
  envelope: any,
  formatter: {
    formatError: (event: any) => string;
    formatLog: (log: any) => string;
    formatTrace: (event: any) => string;
  },
  helpers: {
    isErrorEvent: (payload: any) => boolean;
    isLogEvent: (payload: any) => boolean;
    isTraceEvent: (payload: any) => boolean;
  },
): string {
  const [, items] = envelope;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && helpers.isErrorEvent(payload)) {
      formatted.push(formatter.formatError(payload));
    } else if (type === "log" && helpers.isLogEvent(payload)) {
      const logs = payload.items.map(formatter.formatLog);
      formatted.push(...logs);
    } else if (type === "transaction" && helpers.isTraceEvent(payload)) {
      formatted.push(formatter.formatTrace(payload));
    }
  }

  return formatted.join("\n");
}
