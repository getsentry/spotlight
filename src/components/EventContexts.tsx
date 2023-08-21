import { SentryEvent } from "../types";

const EXAMPLE_CONTEXT = `Sentry.setContext("myContextName", {usefulThing: "useful things value"});`;

export default function EventContexts({ event }: { event: SentryEvent }) {
  if (!event.contexts || !Object.keys(event.contexts).length) {
    return (
      <div className="px-6 space-y-4">
        <div className="text-indigo-300">
          No context available for this event. Try adding some to make debugging
          easier.
        </div>
        <pre className="whitespace-pre-wrap ">{EXAMPLE_CONTEXT}</pre>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {Object.entries(event.contexts).map(([ctxKey, ctxValues]) => {
        return (
          <div key={ctxKey}>
            <h2 className="font-bold uppercase">{ctxKey}</h2>
            <table className="w-full">
              {Object.entries(ctxValues).map(([key, value]) => {
                return (
                  <tr key={key}>
                    <th className="w-1/12 text-left text-indigo-300 font-normal font-mono">
                      <div className="truncate w-full">{key}</div>
                    </th>
                    <td>
                      <pre className="whitespace-nowrap font-mono">{value}</pre>
                    </td>
                  </tr>
                );
              })}
            </table>
          </div>
        );
      })}
    </div>
  );
}
