import type { EventException, EventExceptionValue, SentryErrorEvent } from "@spotlightjs/core/sentry";
import Frame from "./Frame";

export function ErrorTitle({ event }: { event: SentryErrorEvent }) {
  const values = valuesToArray(event.exception);
  return (
    <>
      <strong className="font-bold">{values[0].type}:</strong> {values[0].value}
    </>
  );
}

export function ErrorSummary({ event }: { event: SentryErrorEvent }) {
  const values = valuesToArray(event.exception);

  return (
    <div className="space-y-4 font-mono">
      <h3 className="flex flex-col">
        <strong className="text-xl">{values[0].type}</strong>
        <span className="">{values[0].value}</span>
      </h3>
    </div>
  );
}

export function ErrorItem({ event }: { event: SentryErrorEvent }) {
  const values = valuesToArray(event.exception);

  return (
    <div className="flex-1 px-6 py-4">
      <ol className="space-y-4">
        {values.map((value, valueIdx) => {
          const valueKey = `${value.type}-${value.value}`;
          return (
            <li key={valueKey} className="space-y-4 font-mono">
              <h3 className="bg-primary-950 flex flex-col">
                <strong className="text-xl">{value.type}</strong>
                <pre>{value.value}</pre>
              </h3>
              <ul>
                {value.stacktrace?.frames.map((frame, frameIdx) => {
                  const frameKey = `${frame.filename || "unknown"}-${frame.function || "anonymous"}-${frame.lineno || 0}-${frameIdx}`;
                  return (
                    <Frame
                      key={frameKey}
                      frame={frame}
                      defaultExpand={valueIdx === 0 && frameIdx === 0}
                      platform={event.platform}
                    />
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function valuesToArray(exception: EventException): EventExceptionValue[] {
  if (exception.value) {
    return [exception.value];
  }
  return exception.values;
}
