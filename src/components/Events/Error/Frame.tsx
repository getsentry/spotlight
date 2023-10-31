import { useState } from 'react';
import classNames from '~/lib/classNames';
import { EventFrame, FrameVars } from '~/types';

function formatFilename(filename: string) {
  if (filename.indexOf('/node_modules/') === -1) return filename;
  return `npm:${filename
    .replace(/\/node_modules\//gi, 'npm:')
    .split('npm:')
    .pop()}`;
}

function ContextLocals({ vars }: { vars: FrameVars }) {
  return (
    <table className="w-full table-values">
      <tbody>
        {Object.entries(vars).map(([key, value]) => {
          return (
            <tr key={key}>
              <th>
                <div className="truncate w-full">{key}</div>
              </th>
              <td>
                <pre className="whitespace-nowrap font-mono">{value}</pre>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function Frame({ frame, defaultExpand = false }: { frame: EventFrame; defaultExpand: boolean }) {
  const [isOpen, setOpen] = useState(defaultExpand);

  const hasSource = !!frame.context_line;
  return (
    <li
      className={classNames(
        hasSource ? 'cursor-pointer hover:bg-indigo-800' : '',
        'bg-indigo-900 border-b border-indigo-900 last:border-b-0',
      )}
      onClick={() => setOpen(!isOpen)}
    >
      <div className="text-indigo-400 border-b border-indigo-950 px-2 py-1">
        <span className="text-indigo-100">{formatFilename(frame.filename)}</span> in{' '}
        <span className="text-indigo-100">{frame.function}</span>
        {frame.lineno !== undefined && (
          <>
            {' '}
            at line{' '}
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
                  <pre className="whitespace-pre-wrap flex-1  text-indigo-100 px-2 py-1">{line}</pre>
                </div>
              );
            })}
          {!!frame.context_line && (
            <div
              className={classNames(
                frame.pre_context || frame.post_context ? 'bg-indigo-600' : 'bg-indigo-900',
                'flex items-center',
              )}
            >
              {frame.lineno !== undefined && <div className="text-right w-16 text-indigo-300">{frame.lineno}</div>}
              <pre className="whitespace-pre-wrap text-indigo-100 px-2 py-1">{frame.context_line}</pre>
            </div>
          )}
          {frame.post_context &&
            frame.post_context.map((line, lineNo) => {
              return (
                <div className="flex items-center" key={lineNo}>
                  {frame.lineno !== undefined && (
                    <div className="text-right w-16 text-indigo-300">{frame.lineno + 1 + lineNo}</div>
                  )}
                  <pre className="whitespace-pre-wrap flex-1  text-indigo-100 px-2 py-1">{line}</pre>
                </div>
              );
            })}
          {frame.vars && <ContextLocals vars={frame.vars} />}
        </div>
      )}
    </li>
  );
}
