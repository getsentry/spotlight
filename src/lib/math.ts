export function sum<T>(arr: T[], cb: (item: T) => number): number {
  return arr.reduce((acc, current) => acc + cb(current), 0);
}
