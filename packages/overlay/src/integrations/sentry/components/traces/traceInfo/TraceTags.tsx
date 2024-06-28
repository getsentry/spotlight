import { Trace } from '~/integrations/sentry/types';

type TraceTagsProps = {
  trace: Trace;
};

export default function TraceTags({ trace }: TraceTagsProps) {
  const tags = trace.transactions
    .map(tsx => tsx.tags)
    .reduce((prev, current) => {
      return { ...prev, ...current };
    }, {});

  return (
    <div>
      <h2 className="mb-2 font-bold uppercase">Tags</h2>
      {tags && Object.keys(tags).length ? (
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(tags).map(([key, value]) => {
              return (
                <tr key={key} className="text-primary-300">
                  <th className=" w-1/12 py-0.5 pr-4 text-left font-mono font-normal">
                    <div className="w-full truncate">{key}</div>
                  </th>
                  <td className="py-0.5">
                    <pre className="whitespace-nowrap font-mono">{JSON.stringify(value, undefined, 2)}</pre>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-primary-300">No tags recorded for this Trace.</div>
      )}
    </div>
  );
}
