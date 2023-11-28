import { Link } from 'react-router-dom';
import CardList from '~/components/CardList';
import classNames from '../../../lib/classNames';
import { useSentryTraces } from '../data/useSentryTraces';
import { getDuration } from '../utils/duration';
import PlatformIcon from './PlatformIcon';
import TimeSince from './TimeSince';

export default function TraceList() {
  const traceList = useSentryTraces();

  return (
    <>
      {traceList.length !== 0 ? (
        <CardList>
          {traceList.map(trace => {
            const duration = getDuration(trace.start_timestamp, trace.timestamp);
            return (
              <Link
                className="hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-4"
                key={trace.trace_id}
                to={trace.trace_id}
              >
                <PlatformIcon platform={trace.rootTransaction?.platform} />

                <div className="text-primary-300 flex w-48 flex-col truncate font-mono">
                  <div>{trace.trace_id.substring(0, 8)}</div>
                  <TimeSince date={trace.start_timestamp} />
                </div>
                <div className="flex flex-1 flex-col truncate font-mono">
                  <div>{trace.rootTransactionName}</div>
                  <div className="text-primary-300 flex space-x-2 text-sm">
                    <div
                      className={classNames(
                        trace.status === 'ok' ? 'text-green-400' : trace.status ? 'text-red-400' : '',
                      )}
                    >
                      {trace.status || ''}
                    </div>
                    <div>&mdash;</div>
                    <div>{duration} ms</div>
                    <div>&mdash;</div>
                    <div>
                      {trace.spans.length.toLocaleString()} spans, {trace.transactions.length.toLocaleString()} txns
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </CardList>
      ) : (
        <div className="text-primary-300 p-6">Looks like there's no traces recorded matching this query. 🤔</div>
      )}
    </>
  );
}
