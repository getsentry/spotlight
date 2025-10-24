import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageBuffer } from "./messageBuffer.js";

describe("messageBuffer", () => {
  describe("ring buffer behavior", () => {
    it("should wrap around when buffer size is exceeded", () => {
      const messageBuffer = new MessageBuffer<number>(3);

      messageBuffer.put(0);
      messageBuffer.put(1);
      messageBuffer.put(2);
      messageBuffer.put(3);
      messageBuffer.put(4);

      expect(messageBuffer.read()).toEqual([4, 3, 2]);
    });

    it("should handle exact buffer size fill", () => {
      const messageBuffer = new MessageBuffer<number>(5);

      for (let i = 0; i < 5; i++) {
        messageBuffer.put(i);
      }

      expect(messageBuffer.read()).toEqual([4, 3, 2, 1, 0]);
    });

    it("should handle multiple complete wraparounds", () => {
      const messageBuffer = new MessageBuffer<number>(3);

      for (let i = 0; i < 12; i++) {
        messageBuffer.put(i);
      }

      expect(messageBuffer.read()).toEqual([11, 10, 9]);
    });

    it("should handle empty buffer", () => {
      const messageBuffer = new MessageBuffer<number>(5);

      expect(messageBuffer.read()).toEqual([]);
    });

    it("should handle single item", () => {
      const messageBuffer = new MessageBuffer<number>(5);
      messageBuffer.put(42);

      expect(messageBuffer.read()).toEqual([42]);
    });

    it("should handle buffer size of 1", () => {
      const messageBuffer = new MessageBuffer<number>(1);

      messageBuffer.put(0);
      messageBuffer.put(1);
      messageBuffer.put(2);

      expect(messageBuffer.read()).toEqual([2]);
    });
  });

  describe("clear operation", () => {
    it("should clear all items from buffer", () => {
      const messageBuffer = new MessageBuffer<number>(5);

      for (let i = 0; i < 5; i++) {
        messageBuffer.put(i);
      }

      messageBuffer.clear();

      expect(messageBuffer.read()).toEqual([]);
    });

    it("should reset write position after clear", () => {
      const messageBuffer = new MessageBuffer<number>(3);

      for (let i = 0; i < 5; i++) {
        messageBuffer.put(i);
      }

      messageBuffer.clear();
      messageBuffer.put(10);
      messageBuffer.put(11);

      expect(messageBuffer.read()).toEqual([11, 10]);
    });

    it("should handle clear on empty buffer", () => {
      const messageBuffer = new MessageBuffer<number>(5);

      messageBuffer.clear();

      expect(messageBuffer.read()).toEqual([]);
    });
  });

  describe("reset operation", () => {
    it("should clear items but maintain write position", () => {
      const messageBuffer = new MessageBuffer<number>(5);

      for (let i = 0; i < 10; i++) {
        messageBuffer.put(i);
      }

      messageBuffer.reset();

      expect(messageBuffer.read()).toEqual([]);
      // @ts-expect-error - head is private
      expect(messageBuffer.head).toBe(10);
    });

    it("should allow new items after reset", () => {
      const messageBuffer = new MessageBuffer<number>(5);

      messageBuffer.put(1);
      messageBuffer.put(2);
      messageBuffer.reset();
      messageBuffer.put(10);
      messageBuffer.put(11);

      expect(messageBuffer.read()).toEqual([11, 10]);
    });
  });

  describe("subscribe/unsubscribe", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should call subscriber with new items", async () => {
      const messageBuffer = new MessageBuffer<number>(5);
      const callback = vi.fn();

      messageBuffer.subscribe(callback);
      messageBuffer.put(1);

      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledWith(1);
    });

    it("should call subscriber with all existing items on subscribe", async () => {
      const messageBuffer = new MessageBuffer<number>(5);
      const callback = vi.fn();

      messageBuffer.put(1);
      messageBuffer.put(2);
      messageBuffer.put(3);

      messageBuffer.subscribe(callback);
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith(1);
      expect(callback).toHaveBeenCalledWith(2);
      expect(callback).toHaveBeenCalledWith(3);
    });

    it("should not call subscriber after unsubscribe", async () => {
      const messageBuffer = new MessageBuffer<number>(5);
      const callback = vi.fn();

      const id = messageBuffer.subscribe(callback);
      messageBuffer.put(1);
      await vi.runAllTimersAsync();

      messageBuffer.unsubscribe(id);
      callback.mockClear();

      messageBuffer.put(2);
      await vi.runAllTimersAsync();

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle multiple subscribers", async () => {
      const messageBuffer = new MessageBuffer<number>(5);
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      messageBuffer.subscribe(callback1);
      messageBuffer.subscribe(callback2);

      messageBuffer.put(1);
      await vi.runAllTimersAsync();

      expect(callback1).toHaveBeenCalledWith(1);
      expect(callback2).toHaveBeenCalledWith(1);
    });

    it("should handle subscriber catching up after buffer wraparound", async () => {
      const messageBuffer = new MessageBuffer<number>(3);
      const callback = vi.fn();

      messageBuffer.put(0);
      messageBuffer.put(1);
      messageBuffer.put(2);

      messageBuffer.subscribe(callback);
      await vi.runAllTimersAsync();

      callback.mockClear();

      for (let i = 3; i < 6; i++) {
        messageBuffer.put(i);
      }
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledWith(3);
      expect(callback).toHaveBeenCalledWith(4);
      expect(callback).toHaveBeenCalledWith(5);
    });

    it("should skip items that were overwritten before subscriber reads", async () => {
      const messageBuffer = new MessageBuffer<number>(3);
      const callback = vi.fn();

      messageBuffer.subscribe(callback);
      await vi.runAllTimersAsync();

      callback.mockClear();

      for (let i = 0; i < 10; i++) {
        messageBuffer.put(i);
      }
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith(7);
      expect(callback).toHaveBeenCalledWith(8);
      expect(callback).toHaveBeenCalledWith(9);
    });

    it("should clear subscriber positions on clear", async () => {
      const messageBuffer = new MessageBuffer<number>(5);
      const callback = vi.fn();

      messageBuffer.put(1);
      messageBuffer.put(2);

      messageBuffer.subscribe(callback);
      await vi.runAllTimersAsync();

      callback.mockClear();
      messageBuffer.clear();

      messageBuffer.put(10);
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(10);
    });

    it("should return unique subscriber IDs", () => {
      const messageBuffer = new MessageBuffer<number>(5);
      const callback = vi.fn();

      const id1 = messageBuffer.subscribe(callback);
      const id2 = messageBuffer.subscribe(callback);
      const id3 = messageBuffer.subscribe(callback);

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it("should handle unsubscribe with non-existent ID", () => {
      const messageBuffer = new MessageBuffer<number>(5);

      expect(() => {
        messageBuffer.unsubscribe("non-existent-id");
      }).not.toThrow();
    });
  });

  describe("concurrent operations", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should handle rapid puts", () => {
      const messageBuffer = new MessageBuffer<number>(10);

      for (let i = 0; i < 100; i++) {
        messageBuffer.put(i);
      }

      const result = messageBuffer.read();
      expect(result.length).toBe(10);
      expect(result).toEqual([99, 98, 97, 96, 95, 94, 93, 92, 91, 90]);
    });

    it("should handle interleaved put and read operations", async () => {
      const messageBuffer = new MessageBuffer<number>(5);

      const callback = vi.fn();
      messageBuffer.subscribe(callback);

      messageBuffer.put(0);
      messageBuffer.put(1);

      await vi.runAllTimersAsync();

      expect(messageBuffer.read()).toEqual([1, 0]);
      expect(callback).toHaveBeenCalledTimes(2);

      messageBuffer.put(2);
      messageBuffer.put(3);

      await vi.runAllTimersAsync();

      expect(messageBuffer.read()).toEqual([3, 2, 1, 0]);
      expect(callback).toHaveBeenCalledTimes(4);

      messageBuffer.put(4);
      messageBuffer.put(5);

      await vi.runAllTimersAsync();

      expect(messageBuffer.read()).toEqual([5, 4, 3, 2, 1]);
      expect(callback).toHaveBeenCalledTimes(6);
    });
  });

  describe("edge cases", () => {
    it("should handle very large buffer size", () => {
      const messageBuffer = new MessageBuffer<number>(10000);

      for (let i = 0; i < 5000; i++) {
        messageBuffer.put(i);
      }

      const result = messageBuffer.read();
      expect(result.length).toBe(5000);
      expect(result[0]).toBe(4999);
      expect(result[4999]).toBe(0);
    });

    it("should handle objects as buffer items", () => {
      const messageBuffer = new MessageBuffer<{ id: number; value: string }>(3);

      messageBuffer.put({ id: 1, value: "one" });
      messageBuffer.put({ id: 2, value: "two" });
      messageBuffer.put({ id: 3, value: "three" });

      const result = messageBuffer.read();
      expect(result).toEqual([
        { id: 3, value: "three" },
        { id: 2, value: "two" },
        { id: 1, value: "one" },
      ]);
    });

    it("should handle null and undefined values", () => {
      const messageBuffer = new MessageBuffer<number | null | undefined>(3);

      messageBuffer.put(null);
      messageBuffer.put(undefined);
      messageBuffer.put(0);

      const result = messageBuffer.read();
      expect(result).toEqual([0, undefined, null]);
    });
  });
});
