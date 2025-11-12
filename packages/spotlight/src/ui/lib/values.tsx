export function renderValue(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === "function") {
        return val.toString();
      }
      if (typeof val === "symbol") {
        return val.toString();
      }
      if (typeof val === "bigint") {
        return val.toString();
      }
      return val;
    },
    2,
  );
}
