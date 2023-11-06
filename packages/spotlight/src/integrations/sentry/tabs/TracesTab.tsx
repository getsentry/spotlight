import { useNavigation } from '~/lib/useNavigation';

import useKeyPress from '~/lib/useKeyPress';
import TraceDetails from '../components/TraceDetails';
import TraceList from '../components/TraceList';
import dataCache from '../data/sentryDataCache';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

export default function ErrorsTab() {
  const { traceId, setTraceId } = useNavigation();

  const activeTrace = traceId ? dataCache.getTraceById(traceId) : undefined;

  useKeyPress('Escape', () => {
    setTraceId(null);
  });

  return (
    <SentryEventsContextProvider>
      {activeTrace ? <TraceDetails trace={activeTrace} /> : <TraceList />}
    </SentryEventsContextProvider>
  );
}
