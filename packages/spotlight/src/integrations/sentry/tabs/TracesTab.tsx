import { useNavigation } from '~/lib/useNavigation';

import dataCache from '../data/sentryDataCache';
import useKeyPress from '~/lib/useKeyPress';
import TraceDetails from '../components/TraceDetails';
import TraceList from '../components/TraceList';

export default function ErrorsTab() {
  const { traceId, setTraceId } = useNavigation();

  useKeyPress('Escape', () => {
    setTraceId(null);
  });

  if (traceId) {
    const activeTrace = dataCache.getTraceById(traceId);
    if (activeTrace) {
      return <TraceDetails trace={activeTrace} />;
    }
  }

  return <TraceList />;
}
