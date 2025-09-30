import { uuidv7 } from "uuidv7";
import type { InputSchema } from "./mcp/mcp.js";
import type { EventContainer } from "./utils/eventContainer.js";

export class MessageBuffer<T> {
  private size: number;
  private items: [number, T][];
  private writePos = 0;
  private head = 0;
  private timeout = 10;
  private readers = new Map<string, { tid?: NodeJS.Immediate; pos: number; callback: (item: T) => void }>();

  constructor(size = 100) {
    this.size = size;
    this.items = new Array(size);
  }

  put(item: T): void {
    const curTime = new Date().getTime();
    this.items[this.writePos % this.size] = [curTime, item];
    this.writePos += 1;
    if (this.head === this.writePos) {
      this.head += 1;
    }

    const minTime = curTime - this.timeout * 1000;
    let atItem: [number, T] | undefined;
    while (this.head < this.writePos) {
      atItem = this.items[this.head % this.size];
      if (atItem === undefined) break;
      if (atItem[0] > minTime) break;
      this.head += 1;
    }

    for (const [readerId, readerInfo] of this.readers.entries()) {
      if (readerInfo.tid) {
        clearImmediate(readerInfo.tid);
      }

      readerInfo.tid = setImmediate(() => this.stream(readerId));
    }
  }

  subscribe(callback: (item: T) => void): string {
    const readerId = uuidv7();
    const readerInfo = {
      callback,
      pos: this.head,
      tid: setImmediate(() => this.stream(readerId)),
    };
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
      if (!filterHandlers.every(handler => handler(item, filters))) continue;

      result.push(item[1]);
    }

    return result;
  }

  filterHandlers: Record<keyof ReadFilter | string, (item: [number, T], value: ReadFilter) => boolean> = {
    timeWindow: (item, value) => {
      if (value.timeWindow == null) {
        return true;
      }

      return item[0] > Date.now() - value.timeWindow * 1000;
    },
    envelopeId: (item, value) => {
      if (value.envelopeId == null) {
        return true;
      }

      const data = (item[1] as EventContainer).getParsedEnvelope();

      return data.event[0].__spotlight_envelope_id === value.envelopeId;
    },
    filename: (item, value) => {
      const { filename } = value;
      if (filename == null) {
        return true;
      }

      const contents = (item[1] as EventContainer).getParsedEnvelope();

      return contents.event[1].some(
        ([, payload]) =>
          typeof payload === "object" &&
          "exception" in payload &&
          payload.exception?.values?.some(val =>
            val.stacktrace?.frames?.some(frame => frame.filename?.endsWith(filename)),
          ),
      );
    },
  };
}

export type ReadFilter = Omit<InputSchema, "pagination"> & {
  envelopeId?: string;
};
