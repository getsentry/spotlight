import EnvelopeList from '../components/developerInfo/EnvelopeList';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

import { Route, Routes } from 'react-router-dom';

export default function DeveloperInfoTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/:eventId" element={<EnvelopeList />} />
        <Route path="/" element={<EnvelopeList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
