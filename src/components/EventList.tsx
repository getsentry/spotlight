import { SentryEvent } from "~/types";
import { ErrorSummary } from "./Events/Error";
import { TransactionSummary } from "./Events/Transaction";
import TimeSince from "./TimeSince";
import PlatformIcon from "./PlatformIcon";

function renderEvent(event: SentryEvent) {
  if ("exception" in event) return <ErrorSummary event={event} />;
  if (event.type === "transaction") return <TransactionSummary event={event} />;
  return null;
}

function getFilterFn(
  filter: "errors" | "transactions" | string
): (event: SentryEvent) => boolean {
  switch (filter) {
    case "errors":
      return (event) => "exception" in event;
    case "transactions":
      return (event) => event.type === "transaction";
    default:
      return () => true;
  }
}

export default function EventList({
  events,
  filter,
  setActiveEvent,
}: {
  events: SentryEvent[];
  filter: "errors" | "transactions" | string;
  setActiveEvent: (event: SentryEvent) => void;
}) {
  const matchingEvents = events.filter(getFilterFn(filter));

  return (
    <div className="divide-y divide-indigo-500 bg-indigo-950">
      {matchingEvents.length !== 0 ? (
        matchingEvents.map((e) => {
          return (
            <div
              className="px-6 py-4 flex gap-x-4 items-center cursor-pointer hover:bg-indigo-800"
              key={e.event_id}
              onClick={() => setActiveEvent(e)}
            >
              <PlatformIcon platform={e.platform} className="text-indigo-300" />
              <div className="font-mono text-indigo-300 flex flex-col w-48 truncate">
                <span>{(e.event_id || "").substring(0, 8)}</span>
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
  );
}
