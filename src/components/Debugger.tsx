import classNames from "../lib/classNames";
import { SentryEvent, useSentryEvents } from "../lib/useSentryEvents";
import Error from "./Events/Error";

function renderEvent(event: SentryEvent) {
  if (event.exception) return <Error event={event} />;
  return null;
}

export default function Debugger({
  isOpen,
  setOpen,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
}) {
  const events = useSentryEvents();

  return (
    <div
      className="sentry-debugger"
      style={{
        display: isOpen ? undefined : "none",
      }}
    >
      <div className="flex text-3xl items-center bg-indigo-950 px-6 py-2">
        <h1 className="flex-1">Sentry</h1>
        <button
          className="cursor-pointer px-4 py-1 -mr-2 rounded bg-indigo-950 hover:bg-black font-mono"
          onClick={() => setOpen(false)}
        >
          X
        </button>
      </div>
      <Tabs />
      <div className="divide-y divide-indigo-500 bg-indigo-950">
        {events.map((e) => {
          return (
            <div className="px-6 py-4" key={e.event_id}>
              {renderEvent(e)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tabs() {
  const events = useSentryEvents();

  const tabs = [
    {
      name: "Errors",
      count: events.filter((e) => !!e.exception).length,
      current: true,
    },
    {
      name: "Trace",
      count: events.filter((e) => e.type === "transaction").length,
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
        <nav className="-mb-px flex space-x-8 px-6 border-b" aria-label="Tabs">
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
