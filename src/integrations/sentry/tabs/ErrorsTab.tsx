import { useNavigation } from '~/lib/useNavigation';
import EventList from '../components/EventList';

import dataCache from '../data/sentryDataCache';
import EventDetails from '../components/EventDetails';
import useKeyPress from '~/lib/useKeyPress';

export default function ErrorsTab() {
  const { eventId, setEventId } = useNavigation();

  useKeyPress('Escape', () => {
    setEventId(null);
  });

  if (eventId) {
    const activeEvent = dataCache.getEventById(eventId);
    if (activeEvent) {
      return <EventDetails event={activeEvent} />;
    }
  }

  return <EventList />;
}
