import { getFormattedDuration } from "../../utils/duration";

export function getFormattedSpanDuration(span: { timestamp: number; start_timestamp: number }): string {
  return getFormattedDuration(span.timestamp - span.start_timestamp);
}
