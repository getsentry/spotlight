import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { createTelemetryStore } from "../../../../telemetry/index.ts";
import EventContexts from "./EventContexts";

afterEach(cleanup);

test("renders modules alongside extra data without mutating the SDK event", async () => {
  const telemetry = createTelemetryStore();
  await telemetry.ingestEnvelope([
    {},
    [
      [
        { type: "event" },
        {
          event_id: "context-event",
          timestamp: 1,
          extra: { environment: "local" },
          modules: { react: "19.1" },
        },
      ],
    ],
  ]);
  const event = telemetry.getEvent("context-event")!;
  expect(Object.isFrozen(event.extra)).toBe(true);
  render(<EventContexts event={event} />);
  expect(screen.getByText('"local"')).toBeDefined();
  expect(screen.getByText('"19.1"')).toBeDefined();
  expect(event.extra).toEqual({ environment: "local" });
  telemetry.dispose();
});
