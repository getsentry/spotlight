import SidePanel, { SidePanelHeader } from '~/ui/SidePanel';
import dataCache from '../../../data/sentryDataCache';
import type { TraceContext } from '../../../types';
import TraceGeneralInfo from './TraceGeneralInfo';
import TraceTags from './TraceTags';

type TraceInfoProps = {
  traceContext: TraceContext;
};

export default function TraceInfo({ traceContext }: TraceInfoProps) {
  const traceId = traceContext.trace_id;
  const trace = dataCache.getTraceById(traceId);

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
        <TraceGeneralInfo trace={trace} />

        <TraceTags trace={trace} />
      </div>
    </SidePanel>
  );
}
