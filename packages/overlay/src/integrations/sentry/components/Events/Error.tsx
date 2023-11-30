import { EventException, EventExceptionValue, SentryErrorEvent, SentryEvent } from '../../types';
import Frame from './Error/Frame';

export function ErrorTitle({ event }: { event: SentryErrorEvent | SentryEvent }) {
  if ('exception' in event) {
    const values = arraifyValues(event.exception);
    return (
      <>
        <strong className="font-bold">{values[0].type}:</strong> {values[0].value}
      </>
    );
  }

  return (
    <>
      <strong className="font-bold">{event.message}</strong>
    </>
  );
}

export function ErrorSummary({ event }: { event: SentryErrorEvent | SentryEvent }) {
  if ('exception' in event) {
    const values = arraifyValues(event.exception);

    return (
      <div className="space-y-4 font-mono">
        <h3 className="flex flex-col">
          <strong className="text-xl">{values[0].type}</strong>
          <span className="">{values[0].value}</span>
        </h3>
      </div>
    );
  }
  return (
    <div className="space-y-4 font-mono">
      <h3 className="flex flex-col">
        <strong className="text-xl">{event.message}</strong>
      </h3>
    </div>
  );
}

export default function Error({ event }: { event: SentryErrorEvent | SentryEvent }) {
  if ('exception' in event) {
    const values = arraifyValues(event.exception);

    return (
      <>
        <ol className="space-y-4">
          {values.map((value, valueIdx) => {
            return (
              <li key={valueIdx} className="space-y-4 font-mono">
                <h3 className="bg-primary-950 flex flex-col">
                  <strong className="text-xl">{value.type}</strong>
                  <pre>{value.value}</pre>
                </h3>
                <ul className="border-primary-600 border">
                  {value.stacktrace?.frames.map((frame, frameIdx) => {
                    return <Frame key={frameIdx} frame={frame} defaultExpand={valueIdx === 0 && frameIdx === 0} />;
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      </>
    );
  }

  return (
    <h3 className="bg-primary-950 flex flex-col">
      <strong className="text-xl">Message:</strong>
      <pre>{event.message}</pre>
    </h3>
  );
}

function arraifyValues(exception: EventException): EventExceptionValue[] {
  if (exception.value) {
    return [exception.value];
  }
  return exception.values;
}
