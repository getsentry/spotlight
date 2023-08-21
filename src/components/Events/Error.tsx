import { useState } from "react";
import classNames from "../../lib/classNames";
import { EventFrame, SentryErrorEvent } from "../../types";

function Frame({
  frame,
  defaultExpand = false,
}: {
  frame: EventFrame;
  defaultExpand: boolean;
}) {
  const [isOpen, setOpen] = useState(defaultExpand);

  const hasSource = !!frame.context_line;
  return (
    <li
      className={classNames(
        hasSource ? "cursor-pointer hover:bg-indigo-800" : "",
        "bg-indigo-900 border-b border-indigo-900 last:border-b-0"
      )}
      onClick={() => setOpen(!isOpen)}
    >
      <div className="text-indigo-400 border-b border-indigo-950 px-2 py-1">
        <span className="text-indigo-100">{frame.filename}</span> in{" "}
        <span className="text-indigo-100">{frame.function}</span>
        {frame.lineno !== undefined && (
          <>
            {" "}
            at line{" "}
            <span className="text-indigo-100">
              {frame.lineno}
              {frame.colno !== undefined && `:${frame.colno}`}
            </span>
          </>
        )}
      </div>
      {isOpen && (
        <div className="bg-indigo-950">
          {frame.pre_context &&
            frame.pre_context.map((line, lineNo) => {
              return (
                <div className="flex items-center" key={lineNo}>
                  {frame.lineno !== undefined && (
                    <div className="text-right w-16 text-indigo-300">
                      {frame.lineno - frame.pre_context!.length + lineNo}
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap flex-1  text-indigo-100 px-2 py-1">
                    {line}
                  </pre>
                </div>
              );
            })}
          <div
            className={classNames(
              frame.pre_context || frame.post_context
                ? "bg-indigo-600"
                : "bg-indigo-900",
              "flex items-center"
            )}
          >
            {frame.lineno !== undefined && (
              <div className="text-right w-16 text-indigo-300">
                {frame.lineno}
              </div>
            )}
            <pre className="whitespace-pre-wrap flex-1  text-indigo-100 px-2 py-1">
              {frame.context_line}
            </pre>
          </div>
          {frame.post_context &&
            frame.post_context.map((line, lineNo) => {
              return (
                <div className="flex items-center" key={lineNo}>
                  {frame.lineno !== undefined && (
                    <div className="text-right w-16 text-indigo-300">
                      {frame.lineno + 1 + lineNo}
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap flex-1  text-indigo-100 px-2 py-1">
                    {line}
                  </pre>
                </div>
              );
            })}
        </div>
      )}
    </li>
  );
}

export function getErrorEventTitle({ event }: { event: SentryErrorEvent }) {
  const values =
    "values" in event.exception
      ? event.exception.values
      : [event.exception.value];

  return (
    <>
      <strong className="font-bold">{values[0].type}:</strong> {values[0].value}
    </>
  );
}

export function ErrorSummary({ event }: { event: SentryErrorEvent }) {
  const values =
    "values" in event.exception
      ? event.exception.values
      : [event.exception.value];

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
  const values =
    "values" in event.exception
      ? event.exception.values
      : [event.exception.value];
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
              <ul className="border border-indigo-900">
                {value.stacktrace?.frames.map((frame, frameIdx) => {
                  return (
                    <Frame
                      key={frameIdx}
                      frame={frame}
                      defaultExpand={valueIdx === 0 && frameIdx === 0}
                    />
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </>
  );
}
