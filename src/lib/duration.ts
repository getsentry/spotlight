export function getDuration(start: string | number, end: string | number) {
  const startTs = typeof start === "string" ? new Date(start).getTime() : start;
  const endTs = typeof end === "string" ? new Date(end).getTime() : end;
  return endTs - startTs;
}

export function getSpanDurationClassName(duration: number) {
  if (duration > 1000) return "text-red-400";
  if (duration > 500) return "text-orange-400";
  if (duration > 100) return "text-yellow-400";
}
