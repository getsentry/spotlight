import type { EnvelopeItem } from "@sentry/core";
import { type ReactNode, useEffect, useMemo } from "react";
import { ReactComponent as Download } from "~/assets/download.svg";
import { base64Decode } from "~/lib/base64";
import JsonViewer from "../../shared/JsonViewer";
import { CodeViewer } from "./CodeViewer";

const JSON_CONTENT_TYPES = new Set(["application/json", "text/json", "text/x-json", "application/ld+json"]);
const CODE_CONTENT_TYPES = new Set(["text/css", "text/html", "text/javascript"]);
const IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);

const CONTENT_TYPES_TO_EXTENSION = {
  "text/plain": "txt",
  "text/csv": "csv",
  // Code
  "text/css": "css",
  "text/html": "html",
  "text/javascript": "js",
  // JSON
  "text/json": "json",
  "text/x-json": "json",
  "application/json": "json",
  "application/ld+json": "json",
  // Image
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

export default function Attachment({ header, attachment }: { header: EnvelopeItem[0]; attachment: string }) {
  let content: ReactNode | null = null;
  const extension = CONTENT_TYPES_TO_EXTENSION[header.content_type as keyof typeof CONTENT_TYPES_TO_EXTENSION] ?? "bin";

  const name = (header.filename as string) || `untitled-attachment.${extension}`;

  const downloadUrl = useMemo(
    () =>
      URL.createObjectURL(
        new Blob(
          [
            IMAGE_CONTENT_TYPES.has(header.content_type as string)
              ? Buffer.from(base64Decode(attachment))
              : extension === "bin"
                ? atob(attachment)
                : attachment,
          ],
          { type: (header.content_type as string) || "application/octet-stream" },
        ),
      ),
    [attachment, header.content_type, extension],
  );
  useEffect(() => () => URL.revokeObjectURL(downloadUrl), [downloadUrl]);

  if (header.content_type === "text/plain" || header.content_type === "text/csv") {
    content = (
      <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm p-2 bg-primary-900 rounded-sm">
        {attachment}
      </pre>
    );
  } else if (JSON_CONTENT_TYPES.has(header.content_type as string)) {
    content = <JsonViewer data={JSON.parse(attachment)} />;
  } else if (CODE_CONTENT_TYPES.has(header.content_type as string)) {
    content = <CodeViewer code={attachment} lang={extension} />;
  } else if (IMAGE_CONTENT_TYPES.has(header.content_type as string)) {
    content = <img className="size-full object-contain" src={downloadUrl} alt="Attachment" />;
  }

  return (
    <>
      <h3>
        📎{" "}
        <a href={downloadUrl} download={name}>
          {name} <Download className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity inline" />
        </a>
      </h3>
      {content}
    </>
  );
}
