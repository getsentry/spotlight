import { logger } from "./logger.js";
import { type McpSentryStore, createMcpSentryStore } from "./mcpStore.js";
import type { RawEventContext } from "./nodeAdapter.js";
import type { ContextLinesHandler } from "./nodeCompatibilityLayer.js";
import { processEnvelopeNodeJs } from "./nodeEnvelopeProcessor.js";

export class McpEventProcessor {
  private store: McpSentryStore;

  constructor(contextLinesHandler?: ContextLinesHandler) {
    this.store = createMcpSentryStore(contextLinesHandler);
    logger.info("MCP event processor initialized");
  }

  async processRawEvent(rawEvent: RawEventContext): Promise<void> {
    try {
      // ✅ Use Node.js compatible envelope processor (no store side effects)
      const processed = processEnvelopeNodeJs(rawEvent);

      // ✅ Push to our sidecar store manually
      const store = this.store.getState();
      store.pushEnvelope({
        envelope: processed.event,
        rawEnvelope: rawEvent,
      });

      logger.debug(`Processed envelope with ${processed.event[1].length} items`);
    } catch (error) {
      logger.error("Failed to process event in MCP:", error);
    }
  }

  // ✅ Expose store getters for MCP server (simple pass-through)
  getEvents() {
    return this.store.getState().getEvents();
  }

  getTraces() {
    return Array.from(this.store.getState().tracesById.values());
  }

  getEventById(id: string) {
    return this.store.getState().getEventById(id);
  }

  getTraceById(id: string) {
    return this.store.getState().getTraceById(id);
  }

  getLogsByTraceId(traceId: string) {
    return this.store.getState().getLogsByTraceId(traceId);
  }

  // ✅ Additional helper methods for MCP tools
  getLogs() {
    return this.store.getState().getLogs();
  }

  getProfiles() {
    return Array.from(this.store.getState().profilesByTraceId.values());
  }

  getSdks() {
    return Array.from(this.store.getState().sdks.values());
  }

  // Helper method to get processed events by type
  getErrorEvents() {
    return this.getEvents().filter((event: any) => event.exception);
  }

  getTransactionEvents() {
    return this.getEvents().filter((event: any) => event.type === "transaction");
  }

  // Helper method to reset all data (useful for testing)
  resetData() {
    this.store.getState().resetData();
  }
}
