import { UUID, uuidv7 } from "uuidv7";
import type { InputSchema } from "./mcp/mcp.ts";
import { EventContainer } from "./utils/eventContainer.ts";

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

  /**
   * Binary search for an event by its envelope ID (UUIDv7).
   * Returns the position of the event, or -1 if not found.
   * Takes advantage of UUIDv7's time-ordered property.
   */
  private binarySearchEventId(targetId: string): number {
    let left = this.head;
    let right = this.writePos - 1;

    // Parse and validate the target UUID
    let targetUuid: UUID;
    try {
      targetUuid = UUID.parse(targetId);
    } catch {
      // Invalid UUID format, cannot find
      return -1;
    }

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const item = this.items[mid % this.size];

      // Skip null items or non-EventContainer items
      if (item == null || !(item[1] instanceof EventContainer)) {
        // Linear scan nearby to handle gaps
        let boundsAdjusted = false;

        // Check left side
        for (let i = mid - 1; i >= left; i--) {
          const leftItem = this.items[i % this.size];
          if (leftItem && leftItem[1] instanceof EventContainer) {
            const envelope = leftItem[1].getParsedEnvelope();
            if (envelope?.envelope) {
              const envelopeId = envelope.envelope[0].__spotlight_envelope_id;
              const isEqual = envelopeId.compareTo(targetUuid);
              if (isEqual === 0) {
                return i;
              }
              // Adjust search bounds based on comparison
              if (isEqual < 0) {
                left = mid + 1;
              } else {
                right = mid - 1;
              }
              boundsAdjusted = true;
              break;
            }
          }
        }

        // Check right side if left didn't help
        if (!boundsAdjusted) {
          for (let i = mid + 1; i <= right; i++) {
            const rightItem = this.items[i % this.size];
            if (rightItem && rightItem[1] instanceof EventContainer) {
              const envelope = rightItem[1].getParsedEnvelope();
              if (envelope?.envelope) {
                const envelopeId = envelope.envelope[0].__spotlight_envelope_id;
                const isEqual = envelopeId.compareTo(targetUuid);
                if (isEqual === 0) {
                  return i;
                }
                // Adjust search bounds
                if (isEqual < 0) {
                  left = mid + 1;
                } else {
                  right = mid - 1;
                }
                boundsAdjusted = true;
                break;
              }
            }
          }
        }

        // If both scans failed to find a valid item, skip past this gap
        // to avoid infinite loop
        if (!boundsAdjusted) {
          left = mid + 1;
        }

        continue;
      }

      const envelope = item[1].getParsedEnvelope();
      if (!envelope?.envelope) {
        // Skip invalid envelopes, move to next
        left = mid + 1;
        continue;
      }

      const envelopeId = envelope.envelope[0].__spotlight_envelope_id;

      const isEqual = envelopeId.compareTo(targetUuid);
      if (isEqual === 0) {
        // Found exact match
        return mid;
      }

      if (isEqual < 0) {
        // Target is in the right half (later in time)
        left = mid + 1;
      } else {
        // Target is in the left half (earlier in time)
        right = mid - 1;
      }
    }

    return -1;
  }

  put(item: T): void {
    const curTime = new Date().getTime();

    // Remove old value from filename cache
    const oldValue = this.items[this.writePos % this.size];
    if (oldValue && oldValue[1] instanceof EventContainer) {
      const envelope = oldValue[1].getParsedEnvelope();
      if (envelope?.envelope) {
        const deletedEnvelopeId = envelope.envelope[0].__spotlight_envelope_id.toString();
        const goneFiles = new Set<string>();
        for (const [filename, envelopeIds] of this.filenameCache.entries()) {
          envelopeIds.delete(deletedEnvelopeId);
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
        const spotlightEnvelopeId = envelope.envelope[0].__spotlight_envelope_id.toString();
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
                      envelopeIds.add(spotlightEnvelopeId);
                    } else {
                      this.filenameCache.set(filename, new Set([spotlightEnvelopeId]));
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
      // Binary search for lastEventId (UUIDv7 is time-ordered)
      // Since buffer is chronologically ordered, we can use binary search
      const foundPos = this.binarySearchEventId(lastEventId);
      if (foundPos !== -1) {
        // Start from the position after the found event
        startPos = foundPos + 1;
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

      return data.envelope[0].__spotlight_envelope_id.equals(UUID.parse(value.envelopeId));
    },
    filename: (item, value, ctx) => {
      if (!("filename" in value)) {
        return true;
      }

      const contents = (item[1] as EventContainer).getParsedEnvelope();
      const spotlightEnvelopeId = contents.envelope[0].__spotlight_envelope_id.toString();

      for (const [filename, envelopeIds] of ctx.filenameCache.entries()) {
        if (filename.endsWith(value.filename)) {
          if (envelopeIds.has(spotlightEnvelopeId)) {
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
