import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";
import { MessageBuffer } from "./messageBuffer.ts";
import { EventContainer } from "./utils/eventContainer.ts";

const decompressors: Record<"gzip" | "deflate" | "br", (buf: Buffer) => Buffer> = {
  gzip: gunzipSync,
  deflate: inflateSync,
  br: brotliDecompressSync,
};

export type ContentEncoding = keyof typeof decompressors;

export function createSpotlightBuffer() {
  return new MessageBuffer<EventContainer>();
}

type PushToSpotlightBufferOptions = {
  spotlightBuffer: MessageBuffer<EventContainer>;
  body: Buffer;
  encoding?: ContentEncoding;
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

export function decompressBody(body: Buffer, contentEncoding?: ContentEncoding) {
  if (!contentEncoding) {
    return body;
  }
  return decompressors[contentEncoding](body);
}
