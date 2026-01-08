/**
 * Safely decode a base64 string using atob().
 * Returns null if decoding fails (invalid base64).
 */
export function safeAtob(data: string): string | null {
  try {
    return atob(data);
  } catch {
    // atob throws InvalidCharacterError for invalid base64 strings
    return null;
  }
}

/**
 * Decodes a base64-encoded string to a Uint8Array.
 * Returns null if the input is not valid base64.
 */
export function base64Decode(data: string): Uint8Array | null {
  // TODO: Use Uint8Array.fromBase64 when it becomes available
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64
  const decoded = safeAtob(data);
  if (decoded === null) {
    return null;
  }
  return Uint8Array.from(decoded, c => c.charCodeAt(0));
}
