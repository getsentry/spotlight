import { Link } from 'react-router-dom';
import { Trace } from '~/integrations/sentry/types';
import TraceIcon from '../TraceIcon';

export default function TraceDetailHeader({ trace }: { trace: Trace }) {
  return (
    <div className="border-b-primary-700 bg-primary-950 flex items-center gap-x-2 border-b px-6 py-4">
      <TraceIcon trace={trace} />
      <h1 className="max-w-full flex-1 truncate text-2xl">{trace.rootTransactionName}</h1>
      <div className="text-primary-300 font-mono">
        <div>
          T:{' '}
          <Link className="underline" to={`/traces/${trace.trace_id}/info`}>
            {trace.trace_id}
          </Link>
        </div>
        <div>
          S:{' '}
          <Link to={`/traces/${trace.trace_id}/${trace.span_id}`} className="underline">
            {trace.span_id}
          </Link>
        </div>
      </div>
    </div>
  );
}
