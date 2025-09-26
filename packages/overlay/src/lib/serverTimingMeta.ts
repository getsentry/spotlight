let SERVER_TIMING_DATA: Map<string, string> | null = null;

export function getDataFromServerTiming(name: string): string | undefined {
  if (!SERVER_TIMING_DATA) {
    SERVER_TIMING_DATA = new Map();
    const navTiming = performance.getEntriesByType("navigation");
    if (navTiming.length === 0) {
      return undefined;
    }
    const serverTiming = (navTiming[0] as PerformanceNavigationTiming).serverTiming;
    if (!serverTiming || serverTiming.length === 0) {
      return undefined;
    }
    for (const { name, description } of serverTiming) {
      SERVER_TIMING_DATA.set(name, description);
    }
  }
  return SERVER_TIMING_DATA.get(name);
}
