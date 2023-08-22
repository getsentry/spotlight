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
      onSelect: () => {
        setActiveEvent(null);
        setActiveTrace(null);
        setActiveTab("errors");
      },
    },
    {
      name: "Traces",
      count: Array.from(
        new Set(
          events.map((e) => e.contexts?.trace?.trace_id).filter((e) => !!e)
        )
      ).length,
      active: activeTab === "traces",
      onSelect: () => {
        setActiveEvent(null);
        setActiveTrace(null);
        setActiveTab("traces");
      },
    },
  ];

  if (activeEvent) {
    return (
      <>
        <Tabs tabs={tabs} />
        <EventDetails
          event={activeEvent}
          clearActiveEvent={() => setActiveEvent(null)}
        />
      </>
    );
  }

  if (activeTrace) {
    return (
      <>
        <Tabs tabs={tabs} />
        <TraceDetails
          trace={activeTrace}
          clearActiveTrace={() => setActiveTrace(null)}
        />
      </>
    );
  }

  return (
    <>
      <Tabs tabs={tabs} />
      {activeTab === "traces" ? (
        <TraceList setActiveTrace={setActiveTrace} />
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
