import { useState } from 'react';
import { ReactComponent as PenIcon } from '~/assets/pen.svg';
import { renderValue } from '~/utils/values';
import classNames from '../../../../../lib/classNames';
import { EventFrame, FrameVars } from '../../../types';

function formatFilename(filename: string) {
  const queryPos = filename.lastIndexOf('?');
  if (queryPos > -1) {
    filename = filename.slice(0, queryPos);
  }
  if (filename.indexOf('/node_modules/') === -1) return filename;
  return `npm:${filename
    .replace(/\/node_modules\//gi, 'npm:')
    .split('npm:')
    .pop()}`;
}

function ContextLocals({ vars }: { vars: FrameVars }) {
  return (
    <table className="table-values w-full">
      <tbody>
        {Object.entries(vars).map(([key, value]) => {
          return (
            <tr key={key}>
              <th>
                <div className="w-full truncate">{key}</div>
              </th>
              <td>
                <pre className="whitespace-nowrap font-mono">{renderValue(value)}</pre>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function Frame({
  frame,
  defaultExpand = false,
  platform,
}: {
  frame: EventFrame;
  defaultExpand: boolean;
  platform?: string;
}) {
  const [isOpen, setOpen] = useState(defaultExpand);

  const hasSource = !!frame.context_line;
  const fileName = platform === 'java' ? frame.module : frame.filename || frame.module;
  return (
    <li className="border-primary-900 bg-primary-900 border-b last:border-b-0">
      <div
        className={classNames(
          hasSource ? 'hover:bg-primary-800 cursor-pointer' : '',
          'border-primary-950 text-primary-400 border-b px-2 py-1',
        )}
        onClick={hasSource ? () => setOpen(!isOpen) : undefined}
      >
        {fileName ? (
          <span className="text-primary-100">
            {formatFilename(fileName)}
            {' in '}
          </span>
        ) : null}

        <span className="text-primary-100">{frame.function}</span>
        {frame.lineno !== undefined && (
          <>
            {' '}
            at line{' '}
            <span className="text-primary-100">
              {frame.lineno}
              {frame.colno !== undefined && `:${frame.colno}`}
            </span>
          </>
        )}
        {isOpen && !frame.filename?.includes(':') ? (
          <PenIcon
            width={18}
            height={18}
            title="Open in editor"
            className="mx-2 inline fill-green-400 stroke-green-400 align-top"
            onClick={evt => {
              fetch('http://localhost:8969/open', {
                method: 'POST',
                body: `${frame.filename}:${frame.lineno}:${frame.colno}`,
                credentials: 'omit',
              });
              evt.stopPropagation();
            }}
          />
        ) : null}
      </div>
      {isOpen && (
        <div className="bg-primary-950">
          {frame.pre_context?.map((line, relativeLineNo) => {
            const lineNo =
              frame.lineno != null
                ? frame.lineno - (frame.pre_context as string[]).length + relativeLineNo
                : relativeLineNo;
            return (
              <div className="flex items-center" key={`pre-context-${lineNo}`}>
                {frame.lineno !== undefined && <div className="text-primary-300 w-16 text-right">{lineNo}</div>}
                <pre className="text-primary-100 flex-1  whitespace-pre-wrap px-2 py-1">{line}</pre>
              </div>
            );
          })}
          {frame.context_line && (
            <div
              className={classNames(
                frame.pre_context || frame.post_context ? 'bg-primary-600' : 'bg-primary-900',
                'flex items-center',
              )}
            >
              {frame.lineno !== undefined && <div className="text-primary-300 w-16 text-right">{frame.lineno}</div>}
              <pre className="text-primary-100 whitespace-pre-wrap px-2 py-1">{frame.context_line}</pre>
            </div>
          )}
          {frame.post_context?.map((line, relativeLineNo) => {
            const lineNo = frame.lineno != null ? frame.lineno + 1 + relativeLineNo : relativeLineNo;
            return (
              <div className="flex items-center" key={`post-context-${lineNo}`}>
                {frame.lineno !== undefined && <div className="text-primary-300 w-16 text-right">{lineNo}</div>}
                <pre className="text-primary-100 flex-1  whitespace-pre-wrap px-2 py-1">{line}</pre>
              </div>
            );
          })}
          {frame.vars && <ContextLocals vars={frame.vars} />}
        </div>
      )}
    </li>
  );
}
