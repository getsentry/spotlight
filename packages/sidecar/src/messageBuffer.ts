export class MessageBuffer<T> {
  private size: number;
  private items: [number, T][];
  private writePos = 0;
  private head = 0;
  private timeout = 10;
  private readers = new Map<string, (item: T) => void>();

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
    const readerId = generateUuidv4();
    this.readers.set(readerId, callback);
    setTimeout(() => this.stream(readerId));
    return readerId;
  }

  unsubscribe(readerId: string): void {
    this.readers.delete(readerId);
  }

  stream(readerId: string, readPos = this.head): void {
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

    setTimeout(() => this.stream(readerId, atReadPos), 500);
  }

  /**
   * hard reset: drops items and subscribers and resets cursors.
   */
  clear(): void {
    this.writePos = 0;
    this.reset();
    this.readers.clear();
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

    const minTime = Date.now() - filters.duration * 1000;

    for (let i = end - 1; i >= start; i--) {
      const item = this.items[i % this.size];
      if (item !== undefined) {
        if (item[0] < minTime) {
          break;
        }

        result.push(item[1]);
      }
    }

    return result;
  }

  /**
   * Get all available items in the buffer regardless of age
   * @returns Array of all items currently in the buffer
   */
  getAll(): T[] {
    const result: T[] = [];
    const start = this.head;
    const end = this.writePos;

    for (let i = end - 1; i >= start; i--) {
      const item = this.items[i % this.size];
      if (item !== undefined) {
        result.push(item[1]);
      }
    }

    return result;
  }
}

type ReadFilter = {
  // duration in seconds
  duration: number;
};

export function generateUuidv4(): string {
  let dt = new Date().getTime();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    let rnd = Math.random() * 16;
    rnd = ((dt + rnd) % 16) | 0;
    dt = Math.floor(dt / 16);
    return (c === "x" ? rnd : (rnd & 0x3) | 0x8).toString(16);
  });
}
