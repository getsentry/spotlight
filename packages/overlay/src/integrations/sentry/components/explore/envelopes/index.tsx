import { SentryEventsContextProvider } from '../../../data/sentryEventsContext';
import EnvelopeList from './EnvelopeList';

import { Route, Routes } from 'react-router-dom';

export default function EnvelopesTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/:eventId" element={<EnvelopeList />} />
        <Route path="/" element={<EnvelopeList />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
