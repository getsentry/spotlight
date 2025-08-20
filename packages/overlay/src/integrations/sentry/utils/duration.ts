export function getSpanDurationClassName(duration: number) {
  if (duration > 1000) return "text-red-400";
  if (duration > 500) return "text-orange-400";
  if (duration > 100) return "text-yellow-400";
}
