import { type ParsedEnvelope, processEnvelope } from "../parser/index.js";

/**
 * Container for events that flow through the sidecar
 * Provides lazy parsing only when needed (in debug mode)
 */
export class EventContainer {
  private contentType: string;
  private data: Buffer;
  private parsedEnvelope: ParsedEnvelope | null = null;
  private isParsed = false;

  constructor(contentType: string, data: Buffer) {
    this.contentType = contentType;
    this.data = data;
  }

  /**
   * Get the content type of the event
   */
  getContentType(): string {
    return this.contentType;
  }

  /**
   * Get the raw data buffer
   */
  getData(): Buffer {
    return this.data;
  }

  /**
   * Get parsed envelope data (lazy parsing)
   */
  getParsedEnvelope(): ParsedEnvelope {
    // Parse once and cache the result
    if (!this.isParsed) {
      this.parsedEnvelope = processEnvelope({
        contentType: this.contentType,
        data: this.data,
      });
      this.isParsed = true;
    }

    return this.parsedEnvelope!;
  }

  /**
   * Get a summary of the event types in this container
   * Returns null if not a parseable envelope
   */
  getEventTypes(): string[] | null {
    const envelope = this.getParsedEnvelope();
    if (!envelope) return null;

    const eventTypes: string[] = [];
    for (const item of envelope.envelope[1]) {
      if (item[0].type) {
        eventTypes.push(item[0].type);
      }
    }

    return eventTypes;
  }

  /**
   * Get a formatted string of event types for logging
   */
  getEventTypesString(): string {
    const types = this.getEventTypes();
    if (!types || types.length === 0) {
      return this.contentType === "application/x-sentry-envelope" ? "envelope" : this.contentType;
    }
    return types.join("+");
  }
}
