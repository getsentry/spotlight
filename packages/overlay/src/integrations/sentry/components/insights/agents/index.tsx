import { Route, Routes } from 'react-router-dom';
import { SentryEventsContextProvider } from '~/integrations/sentry/data/sentryEventsContext';
import AgentList from './AgentList';

export default function AgentsTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        {/* <Route path="/:traceId/*" element={<TraceDetails />} /> */}
        <Route path="/" element={<AgentList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
