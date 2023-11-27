import { Link } from 'react-router-dom';
import CardList from '~/components/CardList';
import { useSentryEvents } from '../data/useSentryEvents';
import { SentryEvent } from '../types';
import { ErrorSummary } from './Events/Error';
import PlatformIcon from './PlatformIcon';
import TimeSince from './TimeSince';

function renderEvent(event: SentryEvent) {
  if ('exception' in event) return <ErrorSummary event={event} />;
  return null;
}

export default function EventList() {
  const events = useSentryEvents();

  const matchingEvents = events.filter(e => e.type !== 'transaction');

  return matchingEvents.length !== 0 ? (
    <CardList>
      {matchingEvents.map(e => {
        return (
          <Link
            className="flex cursor-pointer items-center gap-x-4 px-6 py-4 hover:bg-indigo-900"
            key={e.event_id}
            to={e.event_id}
          >
            <PlatformIcon event={e} className="text-indigo-300" />
            <div className="flex w-48 flex-col truncate font-mono text-indigo-300">
              <span>{(e.event_id || '').substring(0, 8)}</span>
              <TimeSince date={e.timestamp} />
            </div>
            <div className="flex-1">{renderEvent(e)}</div>
          </Link>
        );
      })}
    </CardList>
  ) : (
    <div className="p-6 text-indigo-300">Looks like there's no events recorded matching this query. 🤔</div>
  );
}
