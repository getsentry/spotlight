import { SentryEvent } from '../../types';
import { Error, ErrorSummary, ErrorTitle } from './error/Error';

function getEventMessage(event: SentryEvent) {
  if (typeof event.message === 'string') {
    return event.message;
  } else if (event.message !== undefined && typeof event.message.formatted === 'string') {
    return event.message.formatted;
  } else {
    return '';
  }
}

export function EventTitle({ event }: { event: SentryEvent }) {
  if ('exception' in event) {
    return <ErrorTitle event={event} />;
  }

  return (
    <>
      <strong className="font-bold">{getEventMessage(event)}</strong>
    </>
  );
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
    return <Error event={event} />;
  }

  return (
    <h3 className="bg-primary-950 flex flex-col">
      <strong className="text-xl">Message:</strong>
      <pre>{getEventMessage(event)}</pre>
    </h3>
  );
}
