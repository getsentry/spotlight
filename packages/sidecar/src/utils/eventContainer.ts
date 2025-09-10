import { type ParsedEnvelope, processEnvelope } from "~/parsing/index.js";
import { isDebugEnabled } from "../logger.js";

/**
 * Container for events that flow through the sidecar
 * Provides lazy parsing only when needed (in debug mode)
 */
export class EventContainer {
  private contentType: string;
  private data: Buffer;
  private parsedEnvelope?: ParsedEnvelope;
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

    return envelope.event[1].map(item => item[0].type).filter(Boolean) as string[];
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
