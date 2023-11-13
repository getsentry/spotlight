import { Route, Routes } from 'react-router-dom';
import TraceDetails from '../components/TraceDetails';
import TraceList from '../components/TraceList';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

export default function ErrorsTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/" element={<TraceList />} />
        <Route path="/:traceId" element={<TraceDetails />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
