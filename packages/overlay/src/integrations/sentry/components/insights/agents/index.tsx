import { Route, Routes } from 'react-router-dom';
import { SentryEventsContextProvider } from '~/integrations/sentry/data/sentryEventsContext';
import AgentList from './AgentList';

export default function AgentsTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/" element={<AgentList />} />
        <Route path="/:spanId" element={<AgentList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
