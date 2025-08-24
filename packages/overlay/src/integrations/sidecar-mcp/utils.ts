export const DURATION_LABELS = {
  31557600000: "yr",
  2629800000: "mo",
  604800000: "wk",
  86400000: "d",
  3600000: "hr",
  60000: "min",
  1000: "s",
};

const DURATIONS = Object.keys(DURATION_LABELS)
  .map(Number)
  .sort((a, b) => b - a);

export function getFormattedNumber(num: number, decimalPlaces = 2): string {
  return num.toFixed(decimalPlaces).replace(/\.00$/, "");
}

export function getFormattedDuration(duration: number | undefined): string {
  if (duration === undefined) {
    return "N/A";
  }

  for (const limit of DURATIONS) {
    if (duration >= limit) {
      const num = getFormattedNumber(duration / limit);
      return `${num}${DURATION_LABELS[limit as keyof typeof DURATION_LABELS]}`;
    }
  }
  return `${getFormattedNumber(duration)}ms`;
}
