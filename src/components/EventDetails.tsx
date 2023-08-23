import { useState } from "react";
import { SentryEvent } from "../types";
import Error, { ErrorTitle } from "./Events/Error";
import Tabs from "./Tabs";
import EventContexts from "./EventContexts";
import useKeyPress from "~/lib/useKeyPress";
import PlatformIcon from "./PlatformIcon";
import { useNavigation } from "~/lib/useNavigation";
import EventBreadcrumbs from "./EventBreadcrumbs";

function renderEvent(event: SentryEvent) {
  if ("exception" in event) return <Error event={event} />;
  return null;
}

function renderEventTitle(event: SentryEvent) {
  if ("exception" in event) return <ErrorTitle event={event} />;
  return "Unknown Event";
}

export default function EventDetails({ event }: { event: SentryEvent }) {
  const { setEventId, setTraceId, setSpanId } = useNavigation();

  const [activeTab, setActiveTab] = useState("details");

  useKeyPress("Escape", () => {
    setEventId(null);
  });

  const tabs = [
    {
      name: "Details",
      active: activeTab === "details",
      onSelect: () => setActiveTab("details"),
    },
    {
      name: "Breadcrumbs",
      active: activeTab === "breadcrumbs",
      onSelect: () => setActiveTab("breadcrumbs"),
    },
    {
      name: "Context",
      active: activeTab === "contexts",
      onSelect: () => setActiveTab("contexts"),
    },
  ];

  const traceCtx = event.contexts?.trace;
  return (
    <>
      <div className="px-6 py-4 flex gap-x-2 bg-indigo-950 items-center">
        <PlatformIcon platform={event.platform} />
        <h1 className="text-2xl max-w-full truncate flex-1">
          {renderEventTitle(event)}
        </h1>
        {!!traceCtx && (
          <div className="font-mono text-indigo-300">
            <div>
              T:{" "}
              <button
                className="cursor-pointer underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setTraceId(traceCtx.trace_id);
                }}
              >
                {traceCtx.trace_id}
              </button>
            </div>
            <div>
              S:{" "}
              <button
                className="cursor-pointer underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSpanId(traceCtx.trace_id, traceCtx.span_id);
                }}
              >
                {traceCtx.span_id}
              </button>
            </div>
          </div>
        )}
      </div>
      <Tabs tabs={tabs} />
      <div className="divide-indigo-500 flex-1 bg-indigo-950 px-6 py-4">
        {activeTab === "details" && renderEvent(event)}
        {activeTab === "breadcrumbs" && <EventBreadcrumbs event={event} />}
        {activeTab === "contexts" && <EventContexts event={event} />}
      </div>
    </>
  );
}
