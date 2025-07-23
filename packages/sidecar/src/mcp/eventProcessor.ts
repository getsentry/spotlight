import type { RawEventContext } from './nodeAdapter.js';
import { processEnvelopeNodeJs } from './nodeEnvelopeProcessor.js';
import { useSidecarSentryStore, type SidecarSentryStore } from './sidecarStore.js';
import { logger } from '../logger.js';

export class SidecarEventProcessor {
  private store: SidecarSentryStore;
  
  constructor() {
    this.store = useSidecarSentryStore;
    logger.info('Sidecar event processor initialized');
  }
  
  async processRawEvent(rawEvent: RawEventContext): Promise<void> {
    try {
      // ✅ Use Node.js compatible envelope processor (no store side effects)
      const processed = processEnvelopeNodeJs(rawEvent);
      
      // ✅ Push to our sidecar store manually
      const store = this.store.getState();
      store.pushEnvelope({ 
        envelope: processed.event, 
        rawEnvelope: rawEvent 
      });
      
      logger.debug(`Processed envelope with ${processed.event[1].length} items`);
    } catch (error) {
      logger.error('Failed to process event in sidecar:', error);
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
    return this.getEvents().filter(event => event.exception);
  }
  
  getTransactionEvents() {  
    return this.getEvents().filter(event => event.type === 'transaction');
  }
  
  // Helper method to reset all data (useful for testing)
  resetData() {
    this.store.getState().resetData();
  }
}