import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Tabs from '~/components/Tabs';
import AITraceSplitView from '~/integrations/sentry/components/insights/agents/AITraceSplitView';
import { createTab } from '~/integrations/sentry/utils/tabs';
import { hasAISpans } from '../../insights/agents/sdks/aiLibraries';

import { useSentryEvents } from '~/integrations/sentry/data/useSentryEvents';
import useSentryStore from '~/integrations/sentry/store';
import { isLocalTrace } from '~/integrations/sentry/store/helpers';
import { isErrorEvent } from '~/integrations/sentry/utils/sentry';
import EventContexts from '../../events/EventContexts';
import EventList from '../../events/EventList';
import TraceDetailHeader from './components/TraceDetailHeader';

type TraceDetailsProps = {
  traceId: string;
  onClose: () => void;
};

export default function TraceDetails({ traceId, onClose }: TraceDetailsProps) {
  const events = useSentryEvents(traceId);
  const getTraceById = useSentryStore(state => state.getTraceById);

  const errorCount = useMemo(
    () =>
      events.filter(
        e =>
          isErrorEvent(e) && (e.contexts?.trace?.trace_id ? isLocalTrace(e.contexts?.trace?.trace_id) : null) !== false,
      ).length,
    [events],
  );

  // TODO: Don't use dataCache directly, use a helper like useSentryEvents
  const trace = getTraceById(traceId);
  const hasAI = trace ? hasAISpans(trace) : false;
  const [aiMode, setAiMode] = useState(hasAI); // Moved up, before conditionals

  if (!traceId) {
    return <p className="text-primary-300 p-6">Unknown trace id</p>;
  }

  if (!trace) {
    return <p className="text-primary-300 p-6">Trace not found.</p>;
  }

  const tabs = [
    createTab('context', 'Context'),
    createTab('errors', 'Errors', {
      notificationCount: {
        count: errorCount,
        severe: errorCount > 0,
      },
    }),
  ];

  const renderNormalTraceView = () => (
    <>
      <Tabs tabs={tabs} nested />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden ">
        <Routes>
          <Route path="context" element={<EventContexts event={trace.rootTransaction || trace.transactions[0]} />} />
          <Route path="errors" element={<EventList traceId={traceId} />} />
          {/* Default tab */}
          <Route path="*" element={<Navigate to="context" replace />} />
        </Routes>
      </div>
    </>
  );

  const renderAITraceView = () => {
    return <AITraceSplitView traceId={traceId} />;
  };

  return (
    <div className="flex h-full flex-col">
      <TraceDetailHeader
        trace={trace}
        onClose={onClose}
        hasAI={hasAI}
        aiMode={aiMode}
        onToggleAI={() => setAiMode(!aiMode)}
      />

      {aiMode && hasAI ? renderAITraceView() : renderNormalTraceView()}
    </div>
  );
}
