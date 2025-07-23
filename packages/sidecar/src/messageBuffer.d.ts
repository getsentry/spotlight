export declare class MessageBuffer<T> {
  private size;
  private items;
  private writePos;
  private head;
  private timeout;
  private readers;
  constructor(size?: number);
  put(item: T): void;
  subscribe(callback: (item: T) => void): string;
  unsubscribe(readerId: string): void;
  stream(readerId: string, readPos?: number): void;
  clear(): void;
}
