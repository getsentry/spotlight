import { useState } from "react";
import { useSentryEvents } from "../lib/useSentryEvents";
import { SentryEvent, Trace } from "../types";
import Tabs from "./Tabs";
import TraceList from "./TraceList";
import EventList from "./EventList";
import useKeyPress from "~/lib/useKeyPress";
import EventDetails from "./EventDetails";
import TraceDetails from "./TraceDetails";

const DEFAULT_TAB = "errors";

export default function Overview() {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  const events = useSentryEvents();

  const [activeTrace, setActiveTrace] = useState<null | Trace>(null);
  const [activeEvent, setActiveEvent] = useState<null | SentryEvent>(null);

  useKeyPress("Escape", () => {
    setActiveEvent(null);
    setActiveTrace(null);
  });

  const tabs = [
    {
      name: "Errors",
      count: events.filter((e) => "exception" in e).length,
      active: activeTab === "errors",
      onSelect: () => setActiveTab("errors"),
    },
    {
      name: "Traces",
      count: Array.from(
        new Set(
          events.map((e) => e.contexts?.trace?.trace_id).filter((e) => !!e)
        )
      ).length,
      active: activeTab === "traces",
      onSelect: () => setActiveTab("traces"),
    },
    {
      name: "Transactions",
      count: events.filter((e) => e.type === "transaction").length,
      active: activeTab === "transactions",
      onSelect: () => setActiveTab("transactions"),
    },
  ];

  if (activeEvent) {
    return (
      <EventDetails
        event={activeEvent}
        clearActiveEvent={() => setActiveEvent(null)}
      />
    );
  }

  if (activeTrace) {
    return (
      <TraceDetails
        trace={activeTrace}
        clearActiveTrace={() => setActiveTrace(null)}
      />
    );
  }

  return (
    <>
      <Tabs tabs={tabs} />
      {activeTab === "traces" ? (
        <TraceList events={events} setActiveTrace={setActiveTrace} />
      ) : (
        <EventList
          events={events}
          filter={activeTab}
          setActiveEvent={setActiveEvent}
        />
      )}
    </>
  );
}
