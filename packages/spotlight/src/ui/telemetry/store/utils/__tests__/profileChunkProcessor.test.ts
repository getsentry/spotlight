import { describe, expect, it } from "vitest";
import type { SentryProfileV2ChunkEvent } from "../../../types";
import { mergeChunksToProfile, processProfileChunkEvent } from "../profileChunkProcessor";

// Test fixtures based on Sample Format V2 from https://develop.sentry.dev/sdk/telemetry/profiles/sample-format-v2.md
const createV2ProfileChunk = (overrides: Partial<SentryProfileV2ChunkEvent> = {}): SentryProfileV2ChunkEvent => ({
  type: "profile_chunk",
  version: "2",
  profiler_id: "71bba98d90b545c39f2ae73f702d7ef4",
  chunk_id: "3e11a5c9831f4e49939c0a81944ea2cb",
  platform: "cocoa",
  release: "io.sentry.sample.iOS-Swift@8.36.0+1",
  environment: "simulator",
  client_sdk: {
    name: "sentry.cocoa",
    version: "8.36.0",
  },
  profile: {
    samples: [
      { timestamp: 1724777211.5037799, stack_id: 0, thread_id: "259" },
      { timestamp: 1724777211.5137799, stack_id: 1, thread_id: "259" },
      { timestamp: 1724777211.5237799, stack_id: 2, thread_id: "259" },
    ],
    stacks: [
      [0], // main
      [1, 0], // UIApplicationMain -> main
      [2, 1, 0], // appDelegate -> UIApplicationMain -> main
    ],
    frames: [
      { instruction_addr: "0x000000010232d144", function: "_main" },
      { instruction_addr: "0x000000010232d200", function: "UIApplicationMain" },
      { instruction_addr: "0x000000010232d300", function: "-[AppDelegate application:didFinishLaunchingWithOptions:]" },
    ],
    thread_metadata: {
      "259": { name: "main", priority: 31 },
    },
  },
  ...overrides,
});

describe("profileChunkProcessor", () => {
  describe("processProfileChunkEvent", () => {
    it("should process a V2 profile chunk event", () => {
      const event = createV2ProfileChunk();
      const result = processProfileChunkEvent(event);

      expect(result.chunk).toBeDefined();
      expect(result.chunk.profiler_id).toBe("71bba98d90b545c39f2ae73f702d7ef4");
      expect(result.chunk.chunk_id).toBe("3e11a5c9831f4e49939c0a81944ea2cb");
      expect(result.chunk.platform).toBe("cocoa");
    });

    it("should convert V2 timestamps to milliseconds", () => {
      const event = createV2ProfileChunk();
      const result = processProfileChunkEvent(event);

      // V2 timestamps are Unix seconds with microsecond precision
      // They should be converted to milliseconds
      expect(result.chunk.samples[0].start_timestamp).toBe(1724777211.5037799 * 1000);
      expect(result.chunk.samples[1].start_timestamp).toBe(1724777211.5137799 * 1000);
    });

    it("should sort samples by timestamp", () => {
      const event = createV2ProfileChunk({
        profile: {
          samples: [
            { timestamp: 1724777211.5237799, stack_id: 2, thread_id: "259" }, // Later
            { timestamp: 1724777211.5037799, stack_id: 0, thread_id: "259" }, // Earlier
            { timestamp: 1724777211.5137799, stack_id: 1, thread_id: "259" }, // Middle
          ],
          stacks: [[0], [1, 0], [2, 1, 0]],
          frames: [
            { instruction_addr: "0x1", function: "frame1" },
            { instruction_addr: "0x2", function: "frame2" },
            { instruction_addr: "0x3", function: "frame3" },
          ],
          thread_metadata: { "259": { name: "main" } },
        },
      });

      const result = processProfileChunkEvent(event);

      // Samples should be sorted by start_timestamp
      expect(result.chunk.samples[0].stack_id).toBe(0); // Earliest
      expect(result.chunk.samples[1].stack_id).toBe(1); // Middle
      expect(result.chunk.samples[2].stack_id).toBe(2); // Latest
    });

    it("should reverse stacks for visualization (leaf first)", () => {
      const event = createV2ProfileChunk();
      const result = processProfileChunkEvent(event);

      // Original stack [2, 1, 0] should become [0, 1, 2]
      expect(result.chunk.stacks[2]).toEqual([0, 1, 2]);
    });

    it("should calculate start and end timestamps from samples", () => {
      const event = createV2ProfileChunk();
      const result = processProfileChunkEvent(event);

      expect(result.chunk.start_timestamp).toBe(1724777211.5037799 * 1000);
      expect(result.chunk.end_timestamp).toBe(1724777211.5237799 * 1000);
    });

    it("should preserve optional fields", () => {
      const event = createV2ProfileChunk({
        release: "my-app@1.0.0",
        environment: "production",
      });

      const result = processProfileChunkEvent(event);

      expect(result.chunk.release).toBe("my-app@1.0.0");
      expect(result.chunk.environment).toBe("production");
    });

    it("should handle empty samples", () => {
      const event = createV2ProfileChunk({
        profile: {
          samples: [],
          stacks: [],
          frames: [],
          thread_metadata: {},
        },
      });

      const result = processProfileChunkEvent(event);

      expect(result.chunk.samples).toHaveLength(0);
      // Should use Date.now() as fallback - just check it's a number
      expect(typeof result.chunk.start_timestamp).toBe("number");
    });
  });

  describe("mergeChunksToProfile", () => {
    it("should return null for empty chunks array", () => {
      const result = mergeChunksToProfile([]);
      expect(result).toBeNull();
    });

    it("should merge a single chunk into a profile", () => {
      const event = createV2ProfileChunk();
      const { chunk } = processProfileChunkEvent(event);

      const profile = mergeChunksToProfile([chunk]);

      expect(profile).not.toBeNull();
      expect(profile!.platform).toBe("cocoa");
      expect(profile!.samples).toHaveLength(3);
      expect(profile!.frames).toHaveLength(3);
      expect(profile!.stacks).toHaveLength(3);
    });

    it("should merge multiple chunks from the same profiler session", () => {
      const chunk1Event = createV2ProfileChunk({
        chunk_id: "chunk-1",
        profile: {
          samples: [
            { timestamp: 1724777211.5, stack_id: 0, thread_id: "259" },
            { timestamp: 1724777211.51, stack_id: 1, thread_id: "259" },
          ],
          stacks: [[0], [1, 0]],
          frames: [
            { instruction_addr: "0x1", function: "main" },
            { instruction_addr: "0x2", function: "func1" },
          ],
          thread_metadata: { "259": { name: "main" } },
        },
      });

      const chunk2Event = createV2ProfileChunk({
        chunk_id: "chunk-2",
        profile: {
          samples: [
            { timestamp: 1724777211.52, stack_id: 0, thread_id: "259" },
            { timestamp: 1724777211.53, stack_id: 1, thread_id: "259" },
          ],
          stacks: [[0], [1, 0]],
          frames: [
            { instruction_addr: "0x3", function: "viewDidLoad" },
            { instruction_addr: "0x4", function: "loadData" },
          ],
          thread_metadata: { "259": { name: "main" } },
        },
      });

      const { chunk: chunk1 } = processProfileChunkEvent(chunk1Event);
      const { chunk: chunk2 } = processProfileChunkEvent(chunk2Event);

      const profile = mergeChunksToProfile([chunk1, chunk2]);

      expect(profile).not.toBeNull();
      // All samples from both chunks
      expect(profile!.samples).toHaveLength(4);
      // All frames from both chunks
      expect(profile!.frames).toHaveLength(4);
      // All stacks from both chunks
      expect(profile!.stacks).toHaveLength(4);
    });

    it("should sort merged samples by timestamp", () => {
      // Create chunks with interleaved timestamps
      const chunk1Event = createV2ProfileChunk({
        chunk_id: "chunk-1",
        profile: {
          samples: [
            { timestamp: 1724777211.51, stack_id: 0, thread_id: "259" }, // Second
            { timestamp: 1724777211.53, stack_id: 0, thread_id: "259" }, // Fourth
          ],
          stacks: [[0]],
          frames: [{ function: "func1" }],
          thread_metadata: { "259": { name: "main" } },
        },
      });

      const chunk2Event = createV2ProfileChunk({
        chunk_id: "chunk-2",
        profile: {
          samples: [
            { timestamp: 1724777211.5, stack_id: 0, thread_id: "259" }, // First
            { timestamp: 1724777211.52, stack_id: 0, thread_id: "259" }, // Third
          ],
          stacks: [[0]],
          frames: [{ function: "func2" }],
          thread_metadata: { "259": { name: "main" } },
        },
      });

      const { chunk: chunk1 } = processProfileChunkEvent(chunk1Event);
      const { chunk: chunk2 } = processProfileChunkEvent(chunk2Event);

      const profile = mergeChunksToProfile([chunk1, chunk2]);

      expect(profile).not.toBeNull();
      // Verify samples are sorted
      for (let i = 1; i < profile!.samples.length; i++) {
        expect(profile!.samples[i].start_timestamp).toBeGreaterThanOrEqual(profile!.samples[i - 1].start_timestamp);
      }
    });

    it("should use provided activeThreadId", () => {
      const event = createV2ProfileChunk();
      const { chunk } = processProfileChunkEvent(event);

      const profile = mergeChunksToProfile([chunk], "custom-thread-id");

      expect(profile!.active_thread_id).toBe("custom-thread-id");
    });

    it("should default to first sample thread_id when activeThreadId not provided", () => {
      const event = createV2ProfileChunk();
      const { chunk } = processProfileChunkEvent(event);

      const profile = mergeChunksToProfile([chunk]);

      expect(profile!.active_thread_id).toBe("259");
    });

    it("should merge thread metadata from all chunks", () => {
      const chunk1Event = createV2ProfileChunk({
        chunk_id: "chunk-1",
        profile: {
          samples: [{ timestamp: 1724777211.5, stack_id: 0, thread_id: "1" }],
          stacks: [[0]],
          frames: [{ function: "func1" }],
          thread_metadata: { "1": { name: "MainThread", priority: 5 } },
        },
      });

      const chunk2Event = createV2ProfileChunk({
        chunk_id: "chunk-2",
        profile: {
          samples: [{ timestamp: 1724777211.51, stack_id: 0, thread_id: "2" }],
          stacks: [[0]],
          frames: [{ function: "func2" }],
          thread_metadata: { "2": { name: "BackgroundThread", priority: 1 } },
        },
      });

      const { chunk: chunk1 } = processProfileChunkEvent(chunk1Event);
      const { chunk: chunk2 } = processProfileChunkEvent(chunk2Event);

      const profile = mergeChunksToProfile([chunk1, chunk2]);

      expect(profile!.thread_metadata).toEqual({
        "1": { name: "MainThread", priority: 5 },
        "2": { name: "BackgroundThread", priority: 1 },
      });
    });

    it("should handle chunks arriving out of order", () => {
      const earlierChunkEvent = createV2ProfileChunk({
        chunk_id: "earlier-chunk",
        profile: {
          samples: [{ timestamp: 1724777211.5, stack_id: 0, thread_id: "259" }],
          stacks: [[0]],
          frames: [{ function: "earlier" }],
          thread_metadata: { "259": { name: "main" } },
        },
      });

      const laterChunkEvent = createV2ProfileChunk({
        chunk_id: "later-chunk",
        profile: {
          samples: [{ timestamp: 1724777211.6, stack_id: 0, thread_id: "259" }],
          stacks: [[0]],
          frames: [{ function: "later" }],
          thread_metadata: { "259": { name: "main" } },
        },
      });

      const { chunk: earlierChunk } = processProfileChunkEvent(earlierChunkEvent);
      const { chunk: laterChunk } = processProfileChunkEvent(laterChunkEvent);

      // Pass chunks in reverse order
      const profile = mergeChunksToProfile([laterChunk, earlierChunk]);

      expect(profile).not.toBeNull();
      // Platform should come from earliest chunk after sorting
      expect(profile!.timestamp).toBe(earlierChunk.start_timestamp);
    });
  });
});
