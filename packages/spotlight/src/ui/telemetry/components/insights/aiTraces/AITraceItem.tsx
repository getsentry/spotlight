import type { SpotlightAITrace } from "@spotlight/ui/telemetry/types";
import { getFormattedDuration } from "@spotlight/ui/telemetry/utils/duration";
import DateTime from "../../shared/DateTime";
interface AITraceItemProps {
  trace: SpotlightAITrace;
  onClick: () => void;
}

export default function AITraceItem({ trace, onClick }: AITraceItemProps) {
  if (!trace) {
    return null;
  }

  const { id, name, operation, timestamp, durationMs, tokensDisplay } = trace;

  return (
    <tr
      className="hover:bg-primary-900 group cursor-pointer"
      onClick={onClick}
      role="link"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    >
      <td className="text-primary-200 whitespace-nowrap px-6 py-4 text-sm">{id}</td>
      <td className="text-primary-200 whitespace-nowrap px-6 py-4 text-sm">{name}</td>
      <td className="text-primary-200 whitespace-nowrap px-6 py-4 text-sm">{operation}</td>
      <td className="text-primary-200 whitespace-nowrap px-6 py-4 text-sm">
        <DateTime date={timestamp} />
      </td>
      <td className="text-primary-200 whitespace-nowrap px-6 py-4 text-right text-sm">
        {getFormattedDuration(durationMs)}
      </td>
      <td className="text-primary-200 whitespace-nowrap px-6 py-4 text-right text-sm">{tokensDisplay}</td>
    </tr>
  );
}
