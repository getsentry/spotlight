import { Route, Routes } from 'react-router-dom';
import TraceDetails from '../components/traces/TraceDetails';
import TraceList from '../components/traces/TraceList';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

export default function ErrorsTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/:traceId/:spanId" element={<TraceDetails />} />
        <Route path="/:traceId" element={<TraceDetails />} />
        <Route path="/" element={<TraceList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
