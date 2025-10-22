import { describe, expect, it } from "vitest";
import { MessageBuffer } from "./messageBuffer.js";

describe("messageBuffer", () => {
  it("basic usage", async () => {
    const messageBuffer = new MessageBuffer<number>(5);

    for (let i = 0; i < 3; i++) {
      messageBuffer.put(i);
    }

    expect(messageBuffer.read()).toEqual([2, 1, 0]);
  });

  it("should remove old items from buffer when new item is added", async () => {
    const messageBuffer = new MessageBuffer<number>(5);

    for (let i = 0; i < 6; i++) {
      messageBuffer.put(i);
    }

    expect(messageBuffer.read()).toEqual([5, 4, 3, 2, 1]);
  });
});
