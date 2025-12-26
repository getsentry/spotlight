import AnsiText from "@spotlight/ui/telemetry/components/shared/AnsiText";
import JsonViewer from "@spotlight/ui/telemetry/components/shared/JsonViewer";
import { useSentryLog } from "@spotlight/ui/telemetry/data/useSentryLogs";
import SidePanel, { SidePanelHeader } from "@spotlight/ui/ui/sidePanel";
import Table from "@spotlight/ui/ui/table";
import { Link } from "react-router-dom";
import { LOG_LEVEL_COLORS } from "../../constants";
import DateTime from "../shared/DateTime";

export default function LogDetails({ id }: { id: string }) {
  const logData = useSentryLog(id);

  if (!logData) {
    return null;
  }
  const { timestamp, trace_id, body, attributes, level, severity_number } = logData;

  return (
    <SidePanel backto="/telemetry/logs">
      <SidePanelHeader
        title="Log Details"
        subtitle={<span className={LOG_LEVEL_COLORS[level] || "text-primary-500"}>{level.toUpperCase()}</span>}
        backto="/telemetry/logs"
      />

      <div className="space-y-6">
        <div>
          <h2 className="mb-2 font-bold uppercase">Message</h2>
          <pre className="whitespace-pre-wrap break-words font-mono text-sm">
            <AnsiText text={body} />
          </pre>
        </div>

        <div>
          <h2 className="mb-2 font-bold uppercase">Timestamp</h2>
          <DateTime date={timestamp} />
        </div>

        <div>
          <h2 className="mb-2 font-bold uppercase">Trace ID</h2>
          <Link className="underline" to={`/telemetry/traces/${trace_id}`}>
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
                      {typeof value !== "object" || !value ? (
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
