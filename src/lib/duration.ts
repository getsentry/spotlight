export function getDuration(start: string, finish: string) {
  return `${new Date(finish).getTime() - new Date(start).getTime()} ms`;
}
