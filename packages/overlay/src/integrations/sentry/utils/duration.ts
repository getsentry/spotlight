export const DURATION_LABELS = {
  31557600000: 'yr',
  2629800000: 'mo',
  604800000: 'wk',
  86400000: 'd',
  3600000: 'hr',
  60000: 'min',
  1000: 's',
};

const DURATIONS = Object.keys(DURATION_LABELS)
  .map(Number)
  .sort((a, b) => b - a);

export function getSpanDurationClassName(duration: number) {
  if (duration > 1000) return 'text-red-400';
  if (duration > 500) return 'text-orange-400';
  if (duration > 100) return 'text-yellow-400';
}

export function getFormattedNumber(num: number, decimalPlaces: number = 2): string {
  return num.toFixed(decimalPlaces).replace(/\.00$/, '');
}

export function getFormattedDuration(duration: number): string {
  for (const limit of DURATIONS) {
    if (duration >= limit) {
      const num = getFormattedNumber(duration / limit);
      return `${num}${DURATION_LABELS[limit as keyof typeof DURATION_LABELS]}`;
    }
  }
  return `${getFormattedNumber(duration)}ms`;
}

export function getFormattedSpanDuration(span: { timestamp: number; start_timestamp: number }): string {
  return getFormattedDuration(span.timestamp - span.start_timestamp);
}
