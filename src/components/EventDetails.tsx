import { SentryEvent } from "../types";
import Error, { getErrorEventTitle } from "./Events/Error";

function renderEvent(event: SentryEvent) {
  if ("exception" in event) return <Error event={event} />;
  return null;
}

function renderEventTitle(event: SentryEvent) {
  if ("exception" in event) return getErrorEventTitle({ event });
  return "Unknown Event";
}

export default function EventDetails({
  event,
  clearActiveEvent,
}: {
  event: SentryEvent;
  clearActiveEvent: () => void;
}) {
  return (
    <>
      <div className="px-6 py-2 flex gap-x-2 font-mono">
        <button
          className="hover:underline text-indigo-400"
          onClick={() => clearActiveEvent()}
        >
          Events
        </button>
        <div className="text-indigo-600">/</div>
        <h1 className="max-w-md truncate">{renderEventTitle(event)}</h1>
      </div>
      <div className="divide-indigo-500 bg-indigo-950 px-6 py-4">
        {renderEvent(event)}
      </div>
    </>
  );
}
