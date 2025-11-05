import { uuidv7 } from "uuidv7";
import type { InputSchema } from "./mcp/mcp.js";
import { EventContainer } from "./utils/eventContainer.js";

export class MessageBuffer<T> {
  private size: number;
  private items: [number, T][];
  private writePos = 0;
  private head = 0;
  private readers = new Map<string, { tid?: NodeJS.Immediate; pos: number; callback: (item: T) => void }>();
  private filenameCache = new Map<string, Set<string>>();

  constructor(size = 500) {
    this.size = size;
    this.items = new Array(size);
  }

  put(item: T): void {
    const curTime = new Date().getTime();

    // Remove old value from filename cache
    const oldValue = this.items[this.writePos % this.size];
    if (oldValue && oldValue[1] instanceof EventContainer) {
      const envelope = oldValue[1].getParsedEnvelope();
      if (envelope?.envelope) {
        const deletedEnvelopeId = envelope.envelope[0].__spotlight_envelope_id;
        const goneFiles = new Set<string>();
        for (const [filename, envelopeIds] of this.filenameCache.entries()) {
          envelopeIds.delete(String(deletedEnvelopeId));
          if (envelopeIds.size === 0) {
            goneFiles.add(filename);
          }
        }

        for (const filename of goneFiles) {
          this.filenameCache.delete(filename);
        }
      }
    }

    this.items[this.writePos % this.size] = [curTime, item];
    this.writePos += 1;
    if (this.writePos - this.head > this.size) {
      this.head = this.writePos - this.size;
    }

    // Update filename cache
    if (item instanceof EventContainer) {
      const envelope = item.getParsedEnvelope();
      if (envelope?.envelope) {
        const spotlightEnvelopeId = String(envelope.envelope[0].__spotlight_envelope_id);
        const events = envelope.envelope[1] ?? [];

        for (const event of events) {
          const [, payload] = event;
          const values = typeof payload === "object" && "exception" in payload && payload.exception?.values;
          if (values) {
            for (const value of values) {
              const frames = value.stacktrace?.frames;
              if (frames) {
                for (const frame of frames) {
                  const filename = frame.filename;
                  if (filename) {
                    const envelopeIds = this.filenameCache.get(filename);
                    if (envelopeIds) {
                      envelopeIds.add(String(spotlightEnvelopeId));
                    } else {
                      this.filenameCache.set(filename, new Set([String(spotlightEnvelopeId)]));
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Calling subscribers
    for (const [readerId, readerInfo] of this.readers.entries()) {
      if (readerInfo.tid) {
        clearImmediate(readerInfo.tid);
      }

      readerInfo.tid = setImmediate(() => this.stream(readerId));
      readerInfo.tid.unref();
    }
  }

  subscribe(callback: (item: T) => void, lastEventId?: string): string {
    const readerId = uuidv7();

    // Determine starting position based on lastEventId
    let startPos = this.head;
    if (lastEventId) {
      // Find the position of the last event ID
      const start = this.head;
      const end = this.writePos;

      for (let i = start; i < end; i++) {
        const item = this.items[i % this.size];
        if (item == null) continue;

        if (item[1] instanceof EventContainer) {
          const envelope = item[1].getParsedEnvelope();
          if (envelope?.envelope && envelope.envelope[0].__spotlight_envelope_id === lastEventId) {
            // Start from the position after the found event
            startPos = i + 1;
            break;
          }
        }
      }

      // If lastEventId not found, startPos remains at this.head (normal behavior)
    }

    const readerInfo = {
      callback,
      pos: startPos,
      tid: setImmediate(() => this.stream(readerId)),
    };
    readerInfo.tid.unref();
    this.readers.set(readerId, readerInfo);

    return readerId;
  }

  unsubscribe(readerId: string): void {
    const readerInfo = this.readers.get(readerId);
    // Clearing any pending timeouts
    if (readerInfo?.tid) {
      clearImmediate(readerInfo.tid);
    }

    this.readers.delete(readerId);
  }

  stream(readerId: string): void {
    const readerInfo = this.readers.get(readerId);
    if (!readerInfo) return;
    const { pos, callback } = readerInfo;

    let atReadPos = pos < this.head ? this.head : pos;
    let item: [number, T] | undefined;
    /* eslint-disable no-constant-condition */
    while (true) {
      item = this.items[atReadPos % this.size];
      // atReadPos >= this.writePos prevents the case where we have a full buffer
      if (typeof item === "undefined" || atReadPos >= this.writePos) {
        break;
      }
      callback(item[1]);
      atReadPos += 1;
    }

    // No need to `this.readers.set` again, as `readerInfo` is a reference
    readerInfo.pos = atReadPos;
  }

  /**
   * hard reset: drops items and resets cursors.
   */
  clear(): void {
    this.writePos = 0;
    this.reset();

    for (const readerInfo of this.readers.values()) {
      if (readerInfo.tid) {
        clearImmediate(readerInfo.tid);
      }

      readerInfo.tid = undefined;
      readerInfo.pos = this.head;
    }
  }

  /**
   * soft reset: clears buffered items but preserves subscribers
   * do not set head or writePos to `0` as subscribers retain their
   * readPos which would mess things up if we suddenly reset everything
   * to 0.
   */
  reset(): void {
    this.items = new Array(this.size);
    this.head = this.writePos;

    // Clear filename cache
    this.filenameCache.clear();
  }

  read(filters: ReadFilter = { timeWindow: 60 }): T[] {
    const result: T[] = [];
    const start = this.head;
    const end = this.writePos;

    const filterHandlers = [];
    for (const key of Object.keys(filters)) {
      if (this.filterHandlers[key]) {
        filterHandlers.push(this.filterHandlers[key]);
      }
    }

    for (let i = end - 1; i >= start; i--) {
      const item = this.items[i % this.size];

      if (item == null) continue;

      // Check if the item passes all filters
      if (filterHandlers.every(handler => handler(item, filters, { filenameCache: this.filenameCache }))) {
        result.push(item[1]);
      }
    }

    return result;
  }

  filterHandlers: Record<
    keyof ReadFilter | string,
    (item: [number, T], value: NonNullable<ReadFilter>, ctx: { filenameCache: Map<string, Set<string>> }) => boolean
  > = {
    timeWindow: (item, value) => {
      if (!("timeWindow" in value)) {
        return true;
      }

      return item[0] > Date.now() - value.timeWindow * 1000;
    },
    envelopeId: (item, value) => {
      if (!("envelopeId" in value) || value.envelopeId == null) {
        return true;
      }

      const data = (item[1] as EventContainer).getParsedEnvelope();

      return data.envelope[0].__spotlight_envelope_id === value.envelopeId;
    },
    filename: (item, value, ctx) => {
      if (!("filename" in value)) {
        return true;
      }

      const contents = (item[1] as EventContainer).getParsedEnvelope();
      const spotlightEnvelopeId = contents.envelope[0].__spotlight_envelope_id;

      for (const [filename, envelopeIds] of ctx.filenameCache.entries()) {
        if (filename.endsWith(value.filename)) {
          if (envelopeIds.has(String(spotlightEnvelopeId))) {
            return true;
          }
        }
      }

      return false;
    },
    all: () => true,
  };
}

export type ReadFilter =
  | InputSchema["filters"]
  | {
      envelopeId: string;
    }
  | { all: true };
