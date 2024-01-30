export const SECOND = 1000;
export const MINUTE = 60000;
export const HOUR = 3600000;
export const DAY = 86400000;
export const WEEK = 604800000;
export const MONTH = 2629800000;
export const YEAR = 31557600000;

export const DURATION_LABELS = {
  yr: 'yr',
  mo: 'mo',
  wk: 'wk',
  d: 'd',
  hr: 'hr',
  min: 'min',
  s: 's',
  ms: 'ms',
};

export function getDuration(start: string | number, end: string | number) {
  const startTs = typeof start === 'string' ? new Date(start).getTime() : start;
  const endTs = typeof end === 'string' ? new Date(end).getTime() : end;
  return Math.floor(endTs - startTs);
}

export function getSpanDurationClassName(duration: number) {
  if (duration > 1000) return 'text-red-400';
  if (duration > 500) return 'text-orange-400';
  if (duration > 100) return 'text-yellow-400';
}

export function getFormattedNumber(num: number, decimalPlaces: number = 2): string {
  if (num % 1 !== 0 || (num % 1 === 0 && num.toString().includes('.'))) {
    return num.toFixed(decimalPlaces);
  } else {
    return num.toFixed(0);
  }
}

export function getFormattedDuration(duration: number): string {
  if (duration >= YEAR) {
    const num = getFormattedNumber(duration / YEAR);
    return `${num}${DURATION_LABELS.yr}`;
  }

  if (duration >= MONTH) {
    const num = getFormattedNumber(duration / MONTH);
    return `${num}${DURATION_LABELS.mo}`;
  }

  if (duration >= WEEK) {
    const num = getFormattedNumber(duration / WEEK);
    return `${num}${DURATION_LABELS.wk}`;
  }

  if (duration >= DAY) {
    const num = getFormattedNumber(duration / DAY);
    return `${num}${DURATION_LABELS.d}`;
  }

  if (duration >= HOUR) {
    const num = getFormattedNumber(duration / HOUR);
    return `${num}${DURATION_LABELS.hr}`;
  }

  if (duration >= MINUTE) {
    const num = getFormattedNumber(duration / MINUTE);
    return `${num}${DURATION_LABELS.min}`;
  }

  if (duration >= SECOND) {
    const num = getFormattedNumber(duration / SECOND);
    return `${num}${DURATION_LABELS.s}`;
  }

  const num = getFormattedNumber(duration);
  return `${num}${DURATION_LABELS.ms}`;
}
