import { uuidv7 } from "uuidv7";
import type { EventContainer } from "./utils/eventContainer.js";

export class MessageBuffer<T> {
  private size: number;
  private items: [number, T][];
  private writePos = 0;
  private head = 0;
  private timeout = 10;
  private readers = new Map<string, (item: T) => void>();
  private subscribersReadPositions = new Map<string, number>();

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
  }

  subscribe(callback: (item: T) => void): string {
    const readerId = uuidv7();
    this.readers.set(readerId, callback);
    setTimeout(() => this.stream(readerId));
    return readerId;
  }

  unsubscribe(readerId: string): void {
    this.readers.delete(readerId);
    this.subscribersReadPositions.delete(readerId);
  }

  stream(readerId: string): void {
    const readPos = this.subscribersReadPositions.get(readerId) ?? this.head;
    const cb = this.readers.get(readerId);
    if (!cb) return;

    let atReadPos = readPos < this.head ? this.head : readPos;
    let item: [number, T] | undefined;
    /* eslint-disable no-constant-condition */
    while (true) {
      item = this.items[atReadPos % this.size];
      // atReadPos >= this.writePos prevents the case where we have a full buffer
      if (typeof item === "undefined" || atReadPos >= this.writePos) {
        break;
      }
      cb(item[1]);
      atReadPos += 1;
    }

    this.subscribersReadPositions.set(readerId, atReadPos);
    setTimeout(() => this.stream(readerId), 500);
  }

  /**
   * hard reset: drops items and resets cursors.
   */
  clear(): void {
    this.writePos = 0;
    this.reset();

    for (const readerId of this.readers.keys()) {
      this.subscribersReadPositions.delete(readerId);
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

  read(filters: ReadFilter): T[] {
    const result: T[] = [];
    const start = this.head;
    const end = this.writePos;

    for (let i = end - 1; i >= start; i--) {
      const item = this.items[i % this.size];

      if (item !== undefined) {
        // Apply all filters
        const isValid = Object.keys(filters).every(key => this.filterHandlers[key](item, filters));

        // Check if the item passes all filters
        if (!isValid) {
          continue;
        }

        result.push(item[1]);
      }
    }

    return result;
  }

  filterHandlers: Record<keyof ReadFilter | string, (item: [number, T], value: ReadFilter) => boolean> = {
    duration: (item, value) => {
      if (value.duration == null) {
        return true;
      }

      return item[0] > Date.now() - value.duration * 1000;
    },
    envelopeId: (item, value) => {
      if (value.envelopeId == null) {
        return true;
      }

      const data = (item[1] as EventContainer).getParsedEnvelope();

      return data.event[0].__spotlight_envelope_id === value.envelopeId;
    },
  };
}

type ReadFilter = {
  // duration in seconds
  duration?: number;
  envelopeId?: string;
};
