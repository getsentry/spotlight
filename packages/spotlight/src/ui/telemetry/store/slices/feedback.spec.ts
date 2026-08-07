import type { Envelope } from "@sentry/core";
import { beforeEach, describe, expect, test } from "vitest";
import { isFeedbackEvent } from "../../utils/sentry";
import useSentryStore from "../store";

describe("feedback envelope ingestion", () => {
  beforeEach(() => {
    useSentryStore.getState().resetData();
  });

  test("pushEnvelope stores a feedback item as a retrievable event", () => {
    const envelope = [
      {
        event_id: "feedback-event-id",
        sent_at: new Date().toISOString(),
        sdk: { name: "sentry.javascript.react", version: "10.68.0" },
        __spotlight_envelope_id: "envelope-1",
      },
      [
        [
          { type: "feedback" },
          {
            type: "feedback",
            event_id: "feedback-event-id",
            timestamp: Date.now() / 1000,
            contexts: {
              feedback: {
                message: "The checkout button is broken",
                name: "Ada Lovelace",
                contact_email: "ada@example.com",
              },
            },
          },
        ],
      ],
    ] as unknown as Envelope;

    useSentryStore.getState().pushEnvelope(envelope);

    const events = useSentryStore.getState().getEvents();
    const feedbackEvents = events.filter(isFeedbackEvent);

    expect(feedbackEvents).toHaveLength(1);
    expect(feedbackEvents[0].contexts.feedback.message).toBe("The checkout button is broken");
  });
});
