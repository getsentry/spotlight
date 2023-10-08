import { useState } from "react";
import { useSentryEvents } from "../lib/useSentryEvents";
import Tabs from "./Tabs";
import TraceList from "./TraceList";
import EventList from "./EventList";
import useKeyPress from "~/lib/useKeyPress";
import EventDetails from "./EventDetails";
import TraceDetails from "./TraceDetails";
import dataCache from "~/lib/dataCache";
import { useNavigation } from "~/lib/useNavigation";
import SdkList from "./SdkList";
import { useSentryTraces } from "~/lib/useSentryTraces";

const DEFAULT_TAB = "errors";

export default function Overview() {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  const events = useSentryEvents();
  const traces = useSentryTraces();

  const { integrations, traceId, setTraceId, eventId, setEventId, setSpanId } =
    useNavigation();

  useKeyPress("Escape", () => {
    setEventId(null);
    setTraceId(null);
    setSpanId(null);
  });

  const tabs = [
    {
      name: "Errors",
      count: events.filter((e) => "exception" in e).length,
      active: activeTab === "errors" && (!traceId || !!eventId),
      onSelect: () => {
        setEventId(null);
        setTraceId(null);
        setActiveTab("errors");
      },
    },
    {
      name: "Traces",
      count: traces.length,
      active: activeTab === "traces" && (!eventId || !!traceId),
      onSelect: () => {
        setEventId(null);
        setTraceId(null);
        setActiveTab("traces");
      },
    },
    {
      name: "SDKs",
      active: activeTab === "sdks" && !eventId && !traceId,
      onSelect: () => {
        setEventId(null);
        setTraceId(null);
        setActiveTab("sdks");
      },
    },
  ];
  
  integrations.forEach((integration) => {
    if (integration.tabs) {
      integration.tabs.forEach((tab) => {
        tabs.push(
          {
            name: tab.name,
            active: activeTab === tab.name,
            onSelect: () => {
              setEventId(null);
              setTraceId(null);
              setActiveTab(tab.name);
            },
          }
        );
      });
    }
  });
  
  if (eventId) {
    const activeEvent = dataCache.getEventById(eventId);
    if (activeEvent) {
      return (
        <>
          <Tabs tabs={tabs} />
          <EventDetails event={activeEvent} />
        </>
      );
    }
  }

  if (traceId) {
    const activeTrace = dataCache.getTraceById(traceId);
    if (activeTrace) {
      return (
        <>
          <Tabs tabs={tabs} />
          <TraceDetails trace={activeTrace} />
        </>
      );
    }
  }

  return (
    <>
      <Tabs tabs={tabs} />
      {activeTab === "traces" ? (
        <TraceList />
      ) : activeTab == "errors" ? (
        <EventList events={events} />
      ) : (
        <SdkList />
      )}
    </>
  );
}
