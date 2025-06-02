import { Link } from 'react-router-dom';
import JsonViewer from '~/components/JsonViewer';
import { useSentryLog } from '~/integrations/sentry/data/useSentryLogs';
import SidePanel, { SidePanelHeader } from '~/ui/sidePanel';
import Table from '~/ui/table';
import { LOG_LEVEL_COLORS } from '../../constants';
import DateTime from '../shared/DateTime';

export default function LogDetails({ id }: { id: string }) {
  const logData = useSentryLog(id);

  if (!logData) {
    return null;
  }
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
          <h2 className="mb-2 font-bold uppercase">Message</h2>
          <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm">{body}</pre>
        </div>

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

        {severity_number !== undefined && (
          <div>
            <h2 className="mb-2 font-bold uppercase">Severity</h2>
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
