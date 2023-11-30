import { SentryErrorEvent, SentryEvent } from '../../types';
import { Error, ErrorSummary, ErrorTitle } from './Error';

export function EventTitle({ event }: { event: SentryErrorEvent | SentryEvent }) {
  if ('exception' in event) {
    return <ErrorTitle event={event} />;
  }

  return (
    <>
      <strong className="font-bold">{event.message}</strong>
    </>
  );
}

export function EventSummary({ event }: { event: SentryErrorEvent | SentryEvent }) {
  if ('exception' in event) {
    return <ErrorSummary event={event} />;
  }
  return (
    <div className="space-y-4 font-mono">
      <h3 className="flex flex-col">
        <strong className="text-xl">{event.message}</strong>
      </h3>
    </div>
  );
}

export default function Event({ event }: { event: SentryErrorEvent | SentryEvent }) {
  if ('exception' in event) {
    return <Error event={event} />;
  }

  return (
    <h3 className="bg-primary-950 flex flex-col">
      <strong className="text-xl">Message:</strong>
      <pre>{event.message}</pre>
    </h3>
  );
}
