import EventList from '../components/EventList';

import { SentryEventsContextProvider } from '../data/sentryEventsContext';

import { Route, Routes } from 'react-router-dom';
import EventDetails from '../components/EventDetails';

export default function ErrorsTab() {
  return (
    <SentryEventsContextProvider>
      <Routes>
        <Route path="/" element={<EventList />} />
        <Route path="/:eventId/*" element={<EventDetails />} />
      </Routes>
    </SentryEventsContextProvider>
  );
}
