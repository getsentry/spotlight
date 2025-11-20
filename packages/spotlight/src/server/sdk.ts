import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";
import { MessageBuffer } from "./messageBuffer.ts";
import { EventContainer } from "./utils/eventContainer.ts";

const decompressors: Record<string, ((buf: Buffer) => Buffer) | undefined> = {
  gzip: gunzipSync,
  deflate: inflateSync,
  br: brotliDecompressSync,
};

export function createSpotlightBuffer() {
  return new MessageBuffer<EventContainer>();
}

type PushToSpotlightBufferOptions = {
  spotlightBuffer: MessageBuffer<EventContainer>;
  body: Buffer;
  headers: {
    contentEncoding?: string;
    contentType?: string;
    userAgent?: string;
    origin?: string;
  };
};

export function pushToSpotlightBuffer(options: PushToSpotlightBufferOptions) {
  let body = options.body;

  const decompressor = decompressors[options.headers.contentEncoding ?? ""];
  if (decompressor) {
    body = decompressor(body);
  }

  let contentType = options.headers.contentType?.split(";")[0].toLocaleLowerCase();
  if (options.headers.userAgent?.startsWith("sentry.javascript.browser") && options.headers.origin) {
    // This is a correction we make as Sentry Browser SDK may send messages with text/plain to avoid CORS issues
    contentType = "application/x-sentry-envelope";
  }

  if (contentType) {
    // Create event container and add to buffer
    const senderUserAgent = options.headers.userAgent;
    const container = new EventContainer(contentType, body, senderUserAgent);

    // Add to buffer - this will automatically trigger all subscribers
    // including the onEnvelope callback if one is registered
    options.spotlightBuffer.put(container);

    return container;
  }

  return false;
}
