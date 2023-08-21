import { useState } from "react";
import EventList from "./EventList";
import EventDetails from "./EventDetails";
import { SentryEvent } from "../types";

export default function Debugger({
  isOpen,
  setOpen,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
}) {
  const [activeEvent, setActiveEvent] = useState<null | SentryEvent>(null);

  return (
    <div
      className="sentry-debugger"
      style={{
        display: isOpen ? undefined : "none",
      }}
    >
      <div className="flex text-3xl items-center text-indigo-200 bg-indigo-950 px-6 py-4">
        <h1 className="flex-1 space-x-2">
          <span className="font-medium">Spotlight</span>
          <span className="text-sm text-indigo-300">
            by{" "}
            <a
              href="https://sentry.io"
              className="hover:underline font-semibold"
            >
              Sentry
            </a>
          </span>
        </h1>
        <button
          className="cursor-pointer px-3 py-1 -my-1 text-2xl -mr-3 rounded bg-indigo-950 hover:bg-black font-mono"
          onClick={() => setOpen(false)}
        >
          {"✕"}
        </button>
      </div>
      {activeEvent ? (
        <EventDetails
          event={activeEvent}
          clearActiveEvent={() => setActiveEvent(null)}
        />
      ) : (
        <EventList setActiveEvent={setActiveEvent} />
      )}
    </div>
  );
}
