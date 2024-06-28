import { Route, Routes } from 'react-router-dom';
import TraceList from '../components/traces/TraceList';
import TraceDetails from '../components/traces/traceDetail';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

export default function TracesTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/:traceId/:spanId" element={<TraceDetails />} />
        <Route path="/:traceId/info" element={<TraceDetails />} />
        <Route path="/:traceId" element={<TraceDetails />} />
        <Route path="/" element={<TraceList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
