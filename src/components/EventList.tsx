import { useState } from "react";
import { useSentryEvents } from "../lib/useSentryEvents";
import { SentryEvent } from "../types";
import { ErrorSummary } from "./Events/Error";
import Tabs from "./Tabs";
import TimeSince from "./TimeSince";
import { TransactionSummary } from "./Events/Transaction";

const DEFAULT_TAB = "errors";

function renderEvent(event: SentryEvent) {
  if ("exception" in event) return <ErrorSummary event={event} />;
  if (event.type === "transaction") return <TransactionSummary event={event} />;
  return null;
}

function getFilterFn(
  filter: "errors" | "traces" | string
): (event: SentryEvent) => boolean {
  switch (filter) {
    case "errors":
      return (event) => "exception" in event;
    case "traces":
      return (event) => event.type === "transaction";
    default:
      return () => true;
  }
}

export default function EventList({
  setActiveEvent,
}: {
  setActiveEvent: (event: SentryEvent) => void;
}) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  const events = useSentryEvents();

  const tabs = [
    {
      name: "Errors",
      count: events.filter((e) => "exception" in e).length,
      active: activeTab === "errors",
      onSelect: () => setActiveTab("errors"),
    },
    {
      name: "Trace",
      count: events.filter((e) => e.type === "transaction").length,
      active: activeTab === "traces",
      onSelect: () => setActiveTab("traces"),
    },
  ];

  const matchingEvents = events.filter(getFilterFn(activeTab));

  return (
    <>
      <Tabs tabs={tabs} />
      <div className="divide-y divide-indigo-500 bg-indigo-950">
        {matchingEvents.length !== 0 ? (
          matchingEvents.map((e) => {
            return (
              <div
                className="px-6 py-4 flex gap-x-4 items-center cursor-pointer hover:bg-indigo-800"
                key={e.event_id}
                onClick={() => setActiveEvent(e)}
              >
                <div className="font-mono text-indigo-300 flex flex-col w-48 truncate">
                  <span>{e.event_id.substring(0, 8)}</span>
                  <TimeSince date={e.timestamp} />
                </div>
                <div className="flex-1">{renderEvent(e)}</div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-indigo-300">
            Looks like there's no events recorded matching this query. 🤔
          </div>
        )}
      </div>
    </>
  );
}
