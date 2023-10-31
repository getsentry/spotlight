import { SentryErrorEvent } from '~/types';
import Frame from './Error/Frame';

export function ErrorTitle({ event }: { event: SentryErrorEvent }) {
  const values = 'values' in event.exception ? event.exception.values : [event.exception.value];

  return (
    <>
      <strong className="font-bold">{values[0].type}:</strong> {values[0].value}
    </>
  );
}

export function ErrorSummary({ event }: { event: SentryErrorEvent }) {
  const values = 'values' in event.exception ? event.exception.values : [event.exception.value];

  return (
    <div className="font-mono space-y-4">
      <h3 className="flex flex-col">
        <strong className="text-xl">{values[0].type}</strong>
        <span className="">{values[0].value}</span>
      </h3>
    </div>
  );
}

export default function Error({ event }: { event: SentryErrorEvent }) {
  const values = 'values' in event.exception ? event.exception.values : [event.exception.value];

  return (
    <>
      <ol className="space-y-4">
        {values.map((value, valueIdx) => {
          return (
            <li key={valueIdx} className="font-mono space-y-4">
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
