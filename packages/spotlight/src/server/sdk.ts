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
  // eslint-disable-next-line @typescript-eslint/ban-types
  encoding?: "gzip" | "deflate" | "br" | (string & {});
  contentType?: string;
  userAgent?: string;
};

export function pushToSpotlightBuffer(options: PushToSpotlightBufferOptions) {
  const body = decompressBody(options.body, options.encoding);

  const contentType = options.contentType?.split(";")[0].toLocaleLowerCase();

  if (contentType) {
    // Create event container and add to buffer
    const container = new EventContainer(contentType, body, options.userAgent);

    // Add to buffer - this will automatically trigger all subscribers
    // including the onEnvelope callback if one is registered
    options.spotlightBuffer.put(container);

    return container;
  }
}

export function decompressBody(body: Buffer, contentEncoding?: string) {
  const decompressor = decompressors[contentEncoding ?? ""];
  return decompressor ? decompressor(body) : body;
}
