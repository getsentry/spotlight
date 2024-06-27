import { Trace } from '~/integrations/sentry/types';
import { getDuration } from '~/integrations/sentry/utils/duration';
import DateTime from '../../DateTime';

type TraceGeneralInfoProps = {
  trace: Trace;
};

export default function TraceGeneralInfo({ trace }: TraceGeneralInfoProps) {
  const traceId = trace.trace_id;
  return (
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
  );
}
