export function renderValue(value: unknown): string {
  if (value === undefined || value === null) {
    return String(value);
  } else if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'string' ||
    typeof value === 'symbol' ||
    typeof value === 'function' ||
    value instanceof Date
  ) {
    return String(value);
  } else if (Array.isArray(value)) {
    return '[' + value.map(renderValue).join(', ') + ']';
  } else if (value instanceof Map) {
    return (
      '{' +
      Array.from(value.entries())
        .map(([key, val]) => `${renderValue(key)}: ${renderValue(val)}`)
        .join(', ') +
      '}'
    );
  } else if (value instanceof Set) {
    return '{' + Array.from(value).map(renderValue).join(', ') + '}';
  } else if (typeof value === 'object') {
    return (
      '{' +
      Object.entries(value)
        .map(([key, val]) => `${key}: ${renderValue(val)}`)
        .join(', ') +
      '}'
    );
  } else {
    return String(value);
  }
}
