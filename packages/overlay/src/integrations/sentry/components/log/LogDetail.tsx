import { Link } from 'react-router-dom';
import JsonViewer from '~/components/JsonViewer';
import { useSentryLog } from '~/integrations/sentry/data/useSentryLogs';
import SidePanel, { SidePanelHeader } from '~/ui/sidePanel';
import Table from '~/ui/table';
import DateTime from '../shared/DateTime';

const LOG_LEVEL_COLORS: Record<string, string> = {
  trace: 'text-gray-500',
  debug: 'text-blue-500',
  info: 'text-green-500',
  warn: 'text-yellow-500',
  error: 'text-red-500',
  fatal: 'text-purple-500',
};

export default function LogDetails({ id }: { id: string }) {
  const logData = useSentryLog(id);

  if (logData) {
    const { timestamp, trace_id, body, attributes, level, severity_number } = logData;

    return (
      <SidePanel backto="/logs">
        <SidePanelHeader
          title="Log Details"
          subtitle={
            <>
              <span className={LOG_LEVEL_COLORS[level] || 'text-primary-500'}>{level.toUpperCase()}</span>
            </>
          }
          backto="/logs"
        />

        <div className="space-y-6">
          <div>
            <h2 className="mb-2 font-bold uppercase">Timestamp</h2>
            <DateTime date={timestamp} />
          </div>

          <div>
            <h2 className="mb-2 font-bold uppercase">Trace ID</h2>
            <Link className="underline" to={`/traces/${trace_id}`}>
              {trace_id}
            </Link>
          </div>

          <div>
            <h2 className="mb-2 font-bold uppercase">Message</h2>
            <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm">{body}</pre>
          </div>

          {severity_number !== undefined && (
            <div>
              <h2 className="mb-2 font-bold uppercase">Severity Number</h2>
              <pre className="text-primary-300 font-mono">{severity_number}</pre>
            </div>
          )}

          {attributes && Object.keys(attributes).length > 0 && (
            <div>
              <h2 className="mb-2 font-bold uppercase">Attributes</h2>
              <Table className="w-full text-sm">
                <Table.Body>
                  {Object.entries(attributes).map(([key, value]) => (
                    <tr key={key} className="text-primary-300">
                      <th className="w-1/12 py-0.5 pr-4 text-left font-mono font-normal">
                        <div className="w-full truncate">{key}</div>
                      </th>
                      <td className="py-0.5">
                        {typeof value !== 'object' || !value ? (
                          <pre className="text-primary-300 whitespace-nowrap font-mono">{JSON.stringify(value)}</pre>
                        ) : (
                          <JsonViewer key={key} data={value} />
                        )}
                      </td>
                    </tr>
                  ))}
                </Table.Body>
              </Table>
            </div>
          )}
        </div>
      </SidePanel>
    );
  }
  return null;
}
