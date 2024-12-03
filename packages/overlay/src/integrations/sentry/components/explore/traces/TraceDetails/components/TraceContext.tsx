import sentryDataCache from '~/integrations/sentry/data/sentryDataCache';
import type { Tags as TagsType, Trace } from '~/integrations/sentry/types';
import { getDuration } from '~/integrations/sentry/utils/duration';
import DateTime from '../../../../DateTime';
import Tags from '../../../../Tags';

type TraceGeneralInfoProps = {
  trace: Trace;
};

function TraceGeneralInfo({ trace }: TraceGeneralInfoProps) {
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
            [
              'Start Timestamp',
              trace.start_timestamp ? <DateTime key="Start Timestamp" date={trace.start_timestamp} /> : '-',
            ],
            ['Total Duration', `${getDuration(trace.start_timestamp, trace.timestamp).toLocaleString()} ms`],
          ].map(([key, value]) => (
            <tr key={key as string} className="text-primary-300">
              <th className=" w-1/12 py-0.5 pr-4 text-left font-mono font-normal">
                <div className="w-full truncate">{key}</div>
              </th>
              <td className="py-0.5">
                <pre className="whitespace-nowrap font-mono">{value}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type TraceTagsProps = {
  trace: Trace;
};

function TraceTags({ trace }: TraceTagsProps) {
  const tags: TagsType = trace.transactions
    .map(tsx => tsx.tags || {})
    .reduce((prev, current) => Object.assign(prev, current), {} as TagsType);

  return (
    Object.keys(tags).length > 0 && (
      <div>
        <h2 className="mb-2 font-bold uppercase">Tags</h2>
        <Tags tags={tags} />
      </div>
    )
  );
}

type TraceContextProps = {
  traceId: string;
};

export default function TraceContext({ traceId }: TraceContextProps) {
  const trace = sentryDataCache.getTraceById(traceId);

  return (
    <div className="space-y-4 px-6 py-4">
      <TraceGeneralInfo trace={trace} />
      <TraceTags trace={trace} />
    </div>
  );
}
