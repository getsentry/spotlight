import fs from "node:fs";
import { describe, expect, test } from "vitest";
import { processEnvelope } from "../index";
import useSentryStore from "./index";

describe("SentryStore", () => {
  // We need to refactor this to make it actually testable
  test("Process Envelope", () => {
    const envelope = fs.readFileSync("./_fixtures/envelope_javascript.txt");
    const processedEnvelope = processEnvelope({ data: envelope, contentType: "test" });
    expect(
      useSentryStore
        .getState()
        .pushEnvelope({ envelope: processedEnvelope.event, rawEnvelope: processedEnvelope.rawEvent }),
    ).toBeGreaterThanOrEqual(0);
  });
});
