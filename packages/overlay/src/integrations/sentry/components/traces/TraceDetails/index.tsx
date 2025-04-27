import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { createTab } from '~/integrations/sentry/utils/tabs';

import Tabs from '~/components/Tabs';
import { useSentryEvents } from '~/integrations/sentry/data/useSentryEvents';
import useSentryStore from '~/integrations/sentry/store';
import { isErrorEvent } from '~/integrations/sentry/utils/sentry';
import EventContexts from '../../events/EventContexts';
import EventList from '../../events/EventList';
import TraceDetailHeader from './components/TraceDetailHeader';
import TraceTreeview from './components/TraceTreeview';

export default function TraceDetails() {
  const { traceId } = useParams();
  const events = useSentryEvents(traceId);
  const getTraceById = useSentryStore(state => state.getTraceById);
  const { isTraceLocal } = useSentryStore();

  if (!traceId) {
    return <p className="text-primary-300 p-6">Unknown trace id</p>;
  }

  // TODO: Don't use dataCache directly, use a helper like useSentryEvents
  const trace = getTraceById(traceId);

  if (!trace) {
    return (
      <p className="text-primary-300 p-6">
        Trace not found. Check for more{' '}
        <Link to="/traces" className="underline">
          traces
        </Link>
      </p>
    );
  }

  const errorCount = events.filter(
    e => isErrorEvent(e) && (e.contexts?.trace?.trace_id ? isTraceLocal(e.contexts?.trace?.trace_id) : null) !== false,
  ).length;

  const tabs = [
    createTab('details', 'Details'),
    createTab('context', 'Context'),
    createTab('errors', 'Errors', {
      notificationCount: {
        count: errorCount,
        severe: errorCount > 0,
      },
    }),
  ];

  return (
    <>
      <TraceDetailHeader trace={trace} />
      <Tabs tabs={tabs} nested />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="details" element={<TraceTreeview traceId={traceId} />} />
          <Route path="spans/:spanId" element={<TraceTreeview traceId={traceId} />} />
          <Route path="context" element={<EventContexts event={trace.rootTransaction || trace.transactions[0]} />} />
          <Route path="errors" element={<EventList traceId={traceId} />} />
          {/* Default tab */}
          <Route path="*" element={<Navigate to={`/traces/${traceId}/details`} replace />} />
        </Routes>
      </div>
    </>
  );
}
