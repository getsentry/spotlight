import { useState } from 'react';
import type { Trace } from '../../types';
import { Link } from 'react-router-dom';
import CardList from '../../../../components/CardList';
import TimeSince from '../../../../components/TimeSince';
import classNames from '../../../../lib/classNames';
import { useSpotlightContext } from '../../../../lib/useSpotlightContext';
import { useSentryHelpers } from '../../data/useSentryHelpers';
import { useSentryTraces } from '../../data/useSentryTraces';
import Badge from '../../../../ui/Badge';
import Tag from '../../../../ui/Tag';
import { getDuration } from '../../utils/duration';
import HiddenItemsButton from '../HiddenItemsButton';
import TraceIcon from './TraceIcon';

function TransactionName({ trace }: { trace: Trace }) {
  const method = String(
    trace.rootTransaction?.contexts?.trace.data?.method || trace.rootTransaction?.request?.method || '',
  );
  const name =
    method && trace.rootTransactionName.startsWith(method)
      ? trace.rootTransactionName.slice(method.length + 1)
      : trace.rootTransactionName;
  return <Tag tagKey={method} value={name} />;
}

export default function TraceList() {
  const traceList = useSentryTraces();
  const helpers = useSentryHelpers();
  const context = useSpotlightContext();

  const [showAll, setShowAll] = useState(!context.experiments['sentry:focus-local-events']);
  const filteredTraces = showAll ? traceList : traceList.filter(t => helpers.isLocalToSession(t.trace_id) !== false);
  const hiddenItemCount = traceList.length - filteredTraces.length;

  return (
    <>
      {traceList.length !== 0 ? (
        <CardList>
          {hiddenItemCount > 0 && (
            <HiddenItemsButton
              itemCount={hiddenItemCount}
              onClick={() => {
                setShowAll(true);
              }}
            />
          )}
          {filteredTraces.map(trace => {
            const duration = getDuration(trace.start_timestamp, trace.timestamp);
            return (
              <Link
                className="hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-2"
                key={trace.trace_id}
                to={trace.trace_id}
              >
                <TraceIcon trace={trace} />
                <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
                  <div className="flex items-center gap-x-2">
                    <div>{trace.trace_id.substring(0, 8)}</div>
                    {helpers.isLocalToSession(trace.trace_id) ? (
                      <Badge title="This trace is part of your local session.">Local</Badge>
                    ) : null}
                  </div>
                  <TimeSince date={trace.start_timestamp} />
                </div>
                <TransactionName trace={trace} />
                <div className="flex flex-col truncate font-mono">
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
