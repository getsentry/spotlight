export function base64Decode(data: string): Uint8Array {
  // TODO: Use Uint8Array.fromBase64 when it becomes available
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64
  return Uint8Array.from(atob(data), c => c.charCodeAt(0));
}
