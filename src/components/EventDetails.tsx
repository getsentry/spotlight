import { useState } from "react";
import { SentryEvent } from "../types";
import Error, { ErrorTitle } from "./Events/Error";
import Tabs from "./Tabs";
import EventContexts from "./EventContexts";
import Transaction, { TransactionTitle } from "./Events/Transaction";
import useKeyPress from "~/lib/useKeyPress";
import PlatformIcon from "./PlatformIcon";

function renderEvent(event: SentryEvent) {
  if ("exception" in event) return <Error event={event} />;
  if (event.type === "transaction") return <Transaction event={event} />;
  return null;
}

function renderEventTitle(event: SentryEvent) {
  if ("exception" in event) return <ErrorTitle event={event} />;
  if (event.type === "transaction") return <TransactionTitle event={event} />;
  return "Unknown Event";
}

export default function EventDetails({
  event,
  clearActiveEvent,
}: {
  event: SentryEvent;
  clearActiveEvent: () => void;
}) {
  const [activeTab, setActiveTab] = useState("details");

  useKeyPress("Escape", () => {
    clearActiveEvent();
  });

  const tabs = [
    {
      name: "Details",
      active: activeTab === "details",
      onSelect: () => setActiveTab("details"),
    },
    {
      name: "Context",
      active: activeTab === "contexts",
      onSelect: () => setActiveTab("contexts"),
    },
  ];

  const trace = event.contexts?.trace;
  return (
    <>
      <div className="px-6 py-4 flex gap-x-1 bg-indigo-950  items-center">
        <PlatformIcon platform={event.platform} />
        <h1 className="text-2xl max-w-full truncate flex-1">
          {renderEventTitle(event)}
        </h1>
        {!!trace && (
          <div className="font-mono text-indigo-300">
            <div>T: {trace.trace_id}</div>
            <div>S: {trace.span_id}</div>
          </div>
        )}
      </div>
      <Tabs tabs={tabs} />
      <div className="divide-indigo-500 flex-1 bg-indigo-950 px-6 py-4">
        {activeTab === "details" && renderEvent(event)}
        {activeTab === "contexts" && <EventContexts event={event} />}
      </div>
    </>
  );
}
