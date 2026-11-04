import { act, cleanup, render, screen } from "@testing-library/react";
import { useContext } from "react";
import { afterEach, expect, test } from "vitest";
import useSentryStore from "../store";
import { SentryEventsContext, SentryEventsContextProvider } from "./sentryEventsContext";

function Probe() {
  const { events } = useContext(SentryEventsContext);
  return <output data-testid="event-count">{events.length}</output>;
}
afterEach(() => {
  cleanup();
  useSentryStore.getState().resetData();
});

test("reset removes captured events from the React context", async () => {
  useSentryStore.getState().resetData();
  render(
    <SentryEventsContextProvider>
      <Probe />
    </SentryEventsContextProvider>,
  );
  await act(async () => {
    await useSentryStore.getState().ingestEnvelope([{}, [[{ type: "event" }, { event_id: "captured", timestamp: 1 }]]]);
  });
  expect(screen.getByTestId("event-count").textContent).toBe("1");
  act(() => useSentryStore.getState().resetData());
  expect(screen.getByTestId("event-count").textContent).toBe("0");
});

test("raw-only envelope eviction releases old events held by the React context", async () => {
  useSentryStore.getState().resetData();
  await useSentryStore
    .getState()
    .ingestEnvelope([
      { __spotlight_envelope_id: "old" },
      [[{ type: "event" }, { event_id: "captured", timestamp: 1 }]],
    ]);
  render(
    <SentryEventsContextProvider>
      <Probe />
    </SentryEventsContextProvider>,
  );
  expect(screen.getByTestId("event-count").textContent).toBe("1");
  await act(async () => {
    for (let index = 0; index < 500; index++)
      await useSentryStore
        .getState()
        .ingestEnvelope([{ __spotlight_envelope_id: `raw-${index}` }, [[{ type: "unknown" }, {}]]]);
  });
  expect(useSentryStore.getState().getEvents()).toEqual([]);
  expect(screen.getByTestId("event-count").textContent).toBe("0");
});
