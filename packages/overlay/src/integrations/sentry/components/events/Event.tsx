import type { SentryEvent } from '../../types';
import { ErrorItem, ErrorSummary, ErrorTitle } from './error/Error';

function getEventMessage(event: SentryEvent) {
  if (typeof event.message === 'string') {
    return event.message;
  }

  if (event.message !== undefined && typeof event.message.formatted === 'string') {
    return event.message.formatted;
  }

  return '';
}

export function EventTitle({ event }: { event: SentryEvent }) {
  if ('exception' in event) {
    return <ErrorTitle event={event} />;
  }

  return <strong className="font-bold">{getEventMessage(event)}</strong>;
}

export function EventSummary({ event }: { event: SentryEvent }) {
  if ('exception' in event) {
    return <ErrorSummary event={event} />;
  }
  return (
    <div className="space-y-4 font-mono">
      <h3 className="flex flex-col">
        <strong className="text-xl">{getEventMessage(event)}</strong>
      </h3>
    </div>
  );
}

export default function Event({ event }: { event: SentryEvent }) {
  if ('exception' in event) {
    return <ErrorItem event={event} />;
  }

  return (
    <div className="flex-1 px-6 py-4">
      <h3 className="bg-primary-950 flex flex-col">
        <strong className="text-xl">Message:</strong>
        <pre>{getEventMessage(event)}</pre>
      </h3>
    </div>
  );
}
