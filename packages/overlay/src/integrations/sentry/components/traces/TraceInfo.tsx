import SidePanel, { SidePanelHeader } from '~/ui/SidePanel';
import dataCache from '../../data/sentryDataCache';
import { TraceContext } from '../../types';
import { getDuration } from '../../utils/duration';
import DateTime from '../DateTime';

type TraceInfoProps = {
  traceContext: TraceContext;
};

export default function TraceInfo({ traceContext }: TraceInfoProps) {
  const traceId = traceContext.trace_id;
  const trace = dataCache.getTraceById(traceId);
  const tags = trace.transactions
    .map(tsx => tsx.tags)
    .reduce((prev, current) => {
      return { ...prev, ...current };
    }, {});

  return (
    <SidePanel backto={`/traces/${traceId}`}>
      <SidePanelHeader
        title="Trace Details"
        subtitle={
          <>
            Trace Id <span className="text-primary-500">&mdash;</span> {traceId}
          </>
        }
        backto={`/traces/${traceId}`}
      />

      <div className="space-y-6">
        <div>
          <h2 className="mb-2 font-bold uppercase">General</h2>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Trace Id', traceId || '-'],
                ['Spans', trace.spans.length || '-'],
                ['Transactions', trace.transactions.length || '-'],
                ['Errors', trace.errors || '-'],
                ['Start Timestamp', <DateTime date={trace.start_timestamp} /> || '-'],
                ['Total Duration', `${getDuration(trace.start_timestamp, trace.timestamp).toLocaleString()} ms`],
              ].map(([key, value]) => {
                return (
                  <tr key={key as string} className="text-primary-300">
                    <th className=" w-1/12 py-0.5 pr-4 text-left font-mono font-normal">
                      <div className="w-full truncate">{key}</div>
                    </th>
                    <td className="py-0.5">
                      <pre className="whitespace-nowrap font-mono">{value}</pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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
      </div>
    </SidePanel>
  );
}
