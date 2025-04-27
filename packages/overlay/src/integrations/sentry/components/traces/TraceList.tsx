import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '~/ui/Badge';
import CardList from '../../../../components/CardList';
import TimeSince from '../../../../components/TimeSince';
import classNames from '../../../../lib/classNames';
import { useSpotlightContext } from '../../../../lib/useSpotlightContext';
import { useSentryTraces } from '../../data/useSentrySpans';
import useSentryStore from '../../store';
import { getFormattedSpanDuration } from '../../utils/duration';
import { truncateId } from '../../utils/text';
import HiddenItemsButton from '../shared/HiddenItemsButton';
import { TraceRootTxnName } from './TraceDetails/components/TraceRootTxnName';
import TraceIcon from './TraceIcon';

export default function TraceList() {
  const { allTraces, localTraces } = useSentryTraces();
  const context = useSpotlightContext();
  const { isTraceLocal } = useSentryStore();

  const [showAll, setShowAll] = useState(!context.experiments['sentry:focus-local-events']);
  const filteredTraces = showAll ? allTraces : localTraces;
  const hiddenItemCount = allTraces.length - filteredTraces.length;

  return (
    <>
      {allTraces.length !== 0 ? (
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
            return (
              <Link
                className="hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-2"
                key={trace.trace_id}
                to={`/traces/${trace.trace_id}`}
              >
                <TraceIcon trace={trace} />
                <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
                  <div className="flex items-center gap-x-2">
                    <div>{truncateId(trace.trace_id)}</div>
                    {isTraceLocal(trace.trace_id) ? (
                      <Badge title="This trace is part of your local session.">Local</Badge>
                    ) : null}
                  </div>
                  <TimeSince date={trace.start_timestamp} />
                </div>
                <TraceRootTxnName trace={trace} />
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
                    <div>{getFormattedSpanDuration(trace)}</div>
                    <div>&mdash;</div>
                    <div>
                      {trace.spans.size.toLocaleString()} spans, {trace.transactions.length.toLocaleString()} txns
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
