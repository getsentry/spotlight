import { SentryEvent } from "../types";

const EXAMPLE_CONTEXT = `Sentry.setContext("character", {
  name: "Mighty Fighter",
  age: 19,
  attack_type: "melee",
});`;

export default function EventContexts({ event }: { event: SentryEvent }) {
  const contexts = { extra: event.extra, ...event.contexts };
  if (!contexts || !Object.values(contexts).find((v) => !!v)) {
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
      {Object.entries(contexts).map(([ctxKey, ctxValues]) => {
        if (!ctxValues) return null;
        return (
          <div key={ctxKey}>
            <h2 className="font-bold uppercase">{ctxKey}</h2>
            <table className="w-full">
              <tbody>
                {Object.entries(ctxValues).map(([key, value]) => {
                  return (
                    <tr key={key}>
                      <th className="w-1/12 text-left text-indigo-300 font-normal font-mono pr-4 py-0.5">
                        <div className="truncate w-full">{key}</div>
                      </th>
                      <td className="py-0.5">
                        <pre className="whitespace-nowrap font-mono">
                          {JSON.stringify(value, undefined, 2)}
                        </pre>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
