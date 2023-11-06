import { useNavigation } from '~/lib/useNavigation';
import EventList from '../components/EventList';

import useKeyPress from '~/lib/useKeyPress';
import EventDetails from '../components/EventDetails';
import { SentryEventsContextProvider } from '../data/sentryEventsContext';

import dataCache from '../data/sentryDataCache';

export default function ErrorsTab() {
  const { eventId, setEventId } = useNavigation();

  useKeyPress('Escape', () => {
    setEventId(null);
  });

  const activeEvent = eventId ? dataCache.getEventById(eventId) : undefined;

  return (
    <SentryEventsContextProvider>
      {activeEvent ? <EventDetails event={activeEvent} /> : <EventList />}
    </SentryEventsContextProvider>
  );
}
