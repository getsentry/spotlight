import JsonViewer from '../../../../components/JsonViewer';
import type { SentryEvent } from '../../types';
import Tags from '../Tags';

const EXAMPLE_CONTEXT = `Sentry.setContext("character", {
  name: "Mighty Fighter",
  age: 19,
  attack_type: "melee",
});`;

export default function EventContexts({ event }: { event: SentryEvent }) {
  const contextEntries = Object.entries({
    request: event.request,
    extra: {
      modules: event.modules,
      ...(event.extra || {}),
    },
    ...event.contexts,
  }).filter(entry => entry[1]);

  const { tags } = event;

  if (contextEntries.length === 0 && !tags) {
    return (
      <div className="space-y-4 px-6">
        <div className="text-primary-300">
          No context available for this event. Try adding some to make debugging easier.
        </div>
        <pre className="whitespace-pre-wrap ">{EXAMPLE_CONTEXT}</pre>
      </div>
    );
  }
  return (
    <>
      {tags && (
        <div className="pb-4">
          <h2 className="font-bold uppercase">Tags</h2>
          <Tags tags={tags} />
        </div>
      )}
      <div className="space-y-6">
        {contextEntries.map(([ctxKey, ctxValues]) => (
          <div key={ctxKey}>
            <h2 className="font-bold uppercase">{ctxKey}</h2>
            <table className="w-full">
              <tbody>
                {ctxValues &&
                  Object.entries(ctxValues).map(([key, value]) => (
                    <tr key={`${ctxKey}-${key}`}>
                      <th className="text-primary-300 w-1/12 py-0.5 pr-4 text-left font-mono font-normal">
                        <div className="w-full truncate">{key}</div>
                      </th>
                      <td className="py-0.5">
                        {typeof value !== 'object' || !value ? (
                          <pre className="text-primary-300 whitespace-nowrap font-mono">value</pre>
                        ) : (
                          <JsonViewer key={`${ctxKey}-${key}`} data={value} />
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
