export function getDuration(start: string | number, end: string | number) {
  const startTs = typeof start === "string" ? new Date(start).getTime() : start;
  const endTs = typeof end === "string" ? new Date(end).getTime() : end;
  return `${endTs - startTs} ms`;
}
