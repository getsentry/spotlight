import classNames from "../lib/classNames";
import { useSentryEvents } from "../lib/useSentryEvents";
import { SentryEvent } from "../types";
import { ErrorSummary } from "./Events/Error";
import TimeSince from "./TimeSince";

function renderEvent(event: SentryEvent) {
  if ("exception" in event) return <ErrorSummary event={event} />;
  return null;
}

export default function EventList({
  setActiveEvent,
}: {
  setActiveEvent: (event: SentryEvent) => void;
}) {
  const events = useSentryEvents();

  return (
    <>
      <Tabs />
      <div className="divide-y divide-indigo-500 bg-indigo-950">
        {events.map((e) => {
          return (
            <div
              className="px-6 py-4 flex gap-x-4 items-center cursor-pointer hover:bg-indigo-800"
              key={e.event_id}
              onClick={() => setActiveEvent(e)}
            >
              <div className="font-mono text-indigo-300 flex flex-col">
                <span>{e.event_id.substring(0, 6)}</span>
                <TimeSince date={e.timestamp} />
              </div>
              <div className="flex-1">{renderEvent(e)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Tabs() {
  const events = useSentryEvents();

  const tabs = [
    {
      name: "Errors",
      count: events.filter((e) => "exception" in e).length,
      current: true,
    },
    {
      name: "Trace",
      count: events.filter((e) => "type" in e && e.type === "transaction")
        .length,
      current: false,
    },
  ];

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          defaultValue={tabs.find((tab) => tab.current)?.name}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <a
              key={tab.name}
              href="#"
              className={classNames(
                tab.current
                  ? "border-indigo-200 text-indigo-100"
                  : "border-transparent text-indigo-400 hover:border-indigo-400 hover:text-indigo-100",
                "flex whitespace-nowrap border-b-2 py-3 px-2 -mx-2 text-sm font-medium"
              )}
              aria-current={tab.current ? "page" : undefined}
            >
              {tab.name}
              {tab.count !== undefined ? (
                <span
                  className={classNames(
                    tab.current
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-indigo-700 text-indigo-200",
                    "ml-3 hidden rounded py-0.5 px-2.5 text-xs font-medium md:inline-block"
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
