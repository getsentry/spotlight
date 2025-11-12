import { UUID } from "uuidv7";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageBuffer } from "./messageBuffer.ts";
import { EventContainer } from "./utils/eventContainer.ts";

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

  describe("subscribe with lastEventId", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    // Helper function to create an EventContainer with a specific UUID
    function createEventContainerWithId(uuid: UUID, eventData = { type: "event" }): EventContainer {
      // Create a minimal valid Sentry envelope
      const header = JSON.stringify({ event_id: "test", sent_at: new Date().toISOString() });
      const itemHeader = JSON.stringify({ type: "event" });
      const itemPayload = JSON.stringify(eventData);
      const envelope = `${header}\n${itemHeader}\n${itemPayload}\n`;
      const buffer = Buffer.from(envelope, "utf-8");

      const container = new EventContainer("application/x-sentry-envelope", buffer);

      // Force parsing to set the UUID
      const parsed = container.getParsedEnvelope();
      if (parsed?.envelope) {
        // Override the auto-generated UUID with our test UUID
        (parsed.envelope[0] as any).__spotlight_envelope_id = uuid;
      }

      return container;
    }

    it("should subscribe with lastEventId that exists in buffer", async () => {
      const messageBuffer = new MessageBuffer<EventContainer>(5);
      const callback = vi.fn();

      // Create events with known UUIDs
      const uuid1 = UUID.parse("01800000-0000-7000-8000-000000000001");
      const uuid2 = UUID.parse("01800000-0000-7000-8000-000000000002");
      const uuid3 = UUID.parse("01800000-0000-7000-8000-000000000003");
      const uuid4 = UUID.parse("01800000-0000-7000-8000-000000000004");

      const event1 = createEventContainerWithId(uuid1, { type: "event1" });
      const event2 = createEventContainerWithId(uuid2, { type: "event2" });
      const event3 = createEventContainerWithId(uuid3, { type: "event3" });
      const event4 = createEventContainerWithId(uuid4, { type: "event4" });

      messageBuffer.put(event1);
      messageBuffer.put(event2);
      messageBuffer.put(event3);
      messageBuffer.put(event4);

      // Subscribe starting from event2
      messageBuffer.subscribe(callback, uuid2.toString());
      await vi.runAllTimersAsync();

      // Should receive event3 and event4 (after event2)
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(event3);
      expect(callback).toHaveBeenCalledWith(event4);
    });

    it("should subscribe with lastEventId at buffer end", async () => {
      const messageBuffer = new MessageBuffer<EventContainer>(5);
      const callback = vi.fn();

      const uuid1 = UUID.parse("01800000-0000-7000-8000-000000000001");
      const uuid2 = UUID.parse("01800000-0000-7000-8000-000000000002");
      const uuid3 = UUID.parse("01800000-0000-7000-8000-000000000003");

      const event1 = createEventContainerWithId(uuid1);
      const event2 = createEventContainerWithId(uuid2);
      const event3 = createEventContainerWithId(uuid3);

      messageBuffer.put(event1);
      messageBuffer.put(event2);
      messageBuffer.put(event3);

      // Subscribe starting from the last event
      messageBuffer.subscribe(callback, uuid3.toString());
      await vi.runAllTimersAsync();

      // Should receive nothing (already at the end)
      expect(callback).not.toHaveBeenCalled();
    });

    it("should subscribe with lastEventId that was evicted from buffer", async () => {
      const messageBuffer = new MessageBuffer<EventContainer>(3);
      const callback = vi.fn();

      const uuid1 = UUID.parse("01800000-0000-7000-8000-000000000001");
      const uuid2 = UUID.parse("01800000-0000-7000-8000-000000000002");
      const uuid3 = UUID.parse("01800000-0000-7000-8000-000000000003");
      const uuid4 = UUID.parse("01800000-0000-7000-8000-000000000004");
      const uuid5 = UUID.parse("01800000-0000-7000-8000-000000000005");

      const event1 = createEventContainerWithId(uuid1);
      const event2 = createEventContainerWithId(uuid2);
      const event3 = createEventContainerWithId(uuid3);
      const event4 = createEventContainerWithId(uuid4);
      const event5 = createEventContainerWithId(uuid5);

      messageBuffer.put(event1);
      messageBuffer.put(event2);
      messageBuffer.put(event3);

      // Buffer now contains [event1, event2, event3]
      // Add more events to evict event1 and event2
      messageBuffer.put(event4);
      messageBuffer.put(event5);

      // Buffer now contains [event3, event4, event5]
      // Try to subscribe from event1 (which was evicted)
      messageBuffer.subscribe(callback, uuid1.toString());
      await vi.runAllTimersAsync();

      // Should fallback to head and receive all current events
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith(event3);
      expect(callback).toHaveBeenCalledWith(event4);
      expect(callback).toHaveBeenCalledWith(event5);
    });

    it("should subscribe with invalid lastEventId", async () => {
      const messageBuffer = new MessageBuffer<EventContainer>(5);
      const callback = vi.fn();

      const uuid1 = UUID.parse("01800000-0000-7000-8000-000000000001");
      const uuid2 = UUID.parse("01800000-0000-7000-8000-000000000002");

      const event1 = createEventContainerWithId(uuid1);
      const event2 = createEventContainerWithId(uuid2);

      messageBuffer.put(event1);
      messageBuffer.put(event2);

      // Subscribe with invalid UUID format
      messageBuffer.subscribe(callback, "not-a-valid-uuid");
      await vi.runAllTimersAsync();

      // Should fallback to head and receive all events
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(event1);
      expect(callback).toHaveBeenCalledWith(event2);
    });

    it("should handle multiple subscribers with different lastEventIds", async () => {
      const messageBuffer = new MessageBuffer<EventContainer>(5);
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const uuid1 = UUID.parse("01800000-0000-7000-8000-000000000001");
      const uuid2 = UUID.parse("01800000-0000-7000-8000-000000000002");
      const uuid3 = UUID.parse("01800000-0000-7000-8000-000000000003");
      const uuid4 = UUID.parse("01800000-0000-7000-8000-000000000004");

      const event1 = createEventContainerWithId(uuid1);
      const event2 = createEventContainerWithId(uuid2);
      const event3 = createEventContainerWithId(uuid3);
      const event4 = createEventContainerWithId(uuid4);

      messageBuffer.put(event1);
      messageBuffer.put(event2);
      messageBuffer.put(event3);
      messageBuffer.put(event4);

      // Subscribe from different positions
      messageBuffer.subscribe(callback1, uuid1.toString()); // Should get 2, 3, 4
      messageBuffer.subscribe(callback2, uuid2.toString()); // Should get 3, 4
      messageBuffer.subscribe(callback3, uuid3.toString()); // Should get 4

      await vi.runAllTimersAsync();

      expect(callback1).toHaveBeenCalledTimes(3);
      expect(callback2).toHaveBeenCalledTimes(2);
      expect(callback3).toHaveBeenCalledTimes(1);
    });
  });
});
