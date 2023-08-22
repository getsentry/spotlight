import { useState } from "react";
import { SentryEvent } from "../types";
import Error, { ErrorTitle } from "./Events/Error";
import Tabs from "./Tabs";
import EventContexts from "./EventContexts";
import Transaction, { TransactionTitle } from "./Events/Transaction";
import useKeyPress from "~/lib/useKeyPress";

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

  return (
    <>
      <div className="px-6 py-4 flex gap-x-2 bg-indigo-950">
        <div className="flex flex-1 gap-x-2">
          <button
            className="hover:underline text-indigo-400"
            onClick={(e) => {
              e.stopPropagation();
              clearActiveEvent();
            }}
          >
            Events
          </button>
          <div className="text-indigo-600">/</div>
          <h1 className="max-w-full truncate">{renderEventTitle(event)}</h1>
        </div>
        <div className="font-mono">{event.event_id.substring(0, 8)}</div>
      </div>
      <Tabs tabs={tabs} />
      <div className="divide-indigo-500 flex-1 bg-indigo-950 px-6 py-4">
        {activeTab === "details" && renderEvent(event)}
        {activeTab === "contexts" && <EventContexts event={event} />}
      </div>
    </>
  );
}
