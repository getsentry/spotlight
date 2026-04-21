import SidePanel, { SidePanelHeader } from "@spotlight/ui/ui/sidePanel";
import Table from "@spotlight/ui/ui/table";
import { Link, useParams } from "react-router-dom";
import useSentryStore from "../../store";
import { getFormattedNumber } from "../../utils/duration";
import DateTime from "../shared/DateTime";
import JsonViewer from "../shared/JsonViewer";
import MetricTypeBadge from "./components/MetricTypeBadge";

export default function MetricDetail({ traceId }: { traceId?: string }) {
  const { metricId } = useParams<{ metricId?: string }>();
  const getMetricById = useSentryStore(state => state.getMetricById);

  const backRoute = traceId ? `/telemetry/traces/${traceId}/metrics` : "/telemetry/metrics";

  if (!metricId) {
    return (
      <SidePanel backto={backRoute}>
        <SidePanelHeader title="Metric Details" backto={backRoute} />
        <div className="text-primary-300 p-6">Unknown metric ID</div>
      </SidePanel>
    );
  }

  const decodedMetricId = decodeURIComponent(metricId);
  const metric = getMetricById(decodedMetricId);

  if (!metric) {
    return (
      <SidePanel backto={backRoute}>
        <SidePanelHeader title="Metric Details" backto={backRoute} />
        <div className="text-primary-300 p-6">Metric not found.</div>
      </SidePanel>
    );
  }

  return (
    <SidePanel backto={backRoute}>
      <SidePanelHeader
        title={metric.name}
        subtitle={
          <div className="flex items-center gap-3">
            <MetricTypeBadge type={metric.type} />
            {metric.unit && metric.unit !== "none" && (
              <span className="text-primary-400 text-xs">unit: {metric.unit}</span>
            )}
          </div>
        }
        backto={backRoute}
      />

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 font-bold uppercase text-sm">Value</h2>
          <div className="flex items-baseline gap-3">
            <span className="text-primary-50 font-mono text-2xl font-semibold">{getFormattedNumber(metric.value)}</span>
            <span className="text-primary-400 text-base font-mono">
              {metric.unit && metric.unit !== "none" ? `unit: ${metric.unit}` : ""}
            </span>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-bold uppercase text-sm">Timestamp</h2>
          <DateTime date={metric.timestamp * 1000} />
        </section>

        {metric.trace_id && (
          <section>
            <h2 className="mb-2 font-bold uppercase text-sm">Trace Context</h2>
            <Table className="w-full text-sm">
              <Table.Body>
                <tr className="text-primary-300">
                  <th className="w-1/4 py-1 pr-4 text-left font-mono font-normal">Trace ID</th>
                  <td className="py-1">
                    <Link
                      to={`/telemetry/traces/${metric.trace_id}`}
                      className="text-primary-200 hover:text-primary-100 underline font-mono"
                    >
                      {metric.trace_id}
                    </Link>
                  </td>
                </tr>
                {metric.span_id && (
                  <tr className="text-primary-300">
                    <th className="w-1/4 py-1 pr-4 text-left font-mono font-normal">Span ID</th>
                    <td className="py-1 font-mono text-primary-200">{metric.span_id}</td>
                  </tr>
                )}
              </Table.Body>
            </Table>
          </section>
        )}

        {metric.attributes && Object.keys(metric.attributes).length > 0 && (
          <section>
            <h2 className="mb-2 font-bold uppercase text-sm">Attributes</h2>
            <Table className="w-full text-sm">
              <Table.Body>
                {Object.entries(metric.attributes).map(([key, value]) => (
                  <tr key={key} className="text-primary-300">
                    <th className="w-1/3 py-1 pr-4 text-left font-mono font-normal">{key}</th>
                    <td className="py-1 text-primary-200 font-mono">{formatAttributeValue(value)}</td>
                  </tr>
                ))}
              </Table.Body>
            </Table>
          </section>
        )}

        <section>
          <h2 className="mb-2 font-bold uppercase text-sm">Raw Data</h2>
          <JsonViewer data={metric} />
        </section>
      </div>
    </SidePanel>
  );
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "object" && "value" in value) {
    return String((value as { value: unknown }).value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
