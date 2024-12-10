export function removeURLSuffix(url: string, suffix: string): string {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.pathname.endsWith(suffix)) {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -suffix.length);
    }

    return parsedUrl.toString();
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid URL provided: ${url}. Error: ${error.message}`);
    }
    throw error;
  }
}
