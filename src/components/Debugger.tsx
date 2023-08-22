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
      <div className="flex text-3xl items-center text-indigo-200 bg-indigo-950 px-6 py-4 gap-x-2">
        <img
          src="data:image/png;base64,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"
          width="36"
          height="36"
          className="opacity-60"
        />
        <h1 className="flex-1 space-x-1 font-raleway opacity-60">
          <span className="uppercase font-light tracking-widest">
            Spotlight
          </span>
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
