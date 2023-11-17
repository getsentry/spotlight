import { EventException, EventExceptionValue, SentryErrorEvent } from '../../types';
import Frame from './Error/Frame';

export function ErrorTitle({ event }: { event: SentryErrorEvent }) {
  const values = arraifyValues(event.exception);

  return (
    <>
      <strong className="font-bold">{values[0].type}:</strong> {values[0].value}
    </>
  );
}

export function ErrorSummary({ event }: { event: SentryErrorEvent }) {
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

export default function Error({ event }: { event: SentryErrorEvent }) {
  const values = arraifyValues(event.exception);

  return (
    <>
      <ol className="space-y-4">
        {values.map((value, valueIdx) => {
          return (
            <li key={valueIdx} className="space-y-4 font-mono">
              <h3 className="flex flex-col bg-indigo-950">
                <strong className="text-xl">{value.type}</strong>
                <span className="">{value.value}</span>
              </h3>
              <ul className="border border-indigo-600">
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

function arraifyValues(exception: EventException): EventExceptionValue[] {
  if (exception.value) {
    return [exception.value];
  }
  return exception.values;
}
