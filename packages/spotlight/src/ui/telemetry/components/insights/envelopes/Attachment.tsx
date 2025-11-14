import type { EnvelopeItem } from "@sentry/core";
import { ReactComponent as Download } from "@spotlight/ui/assets/download.svg";
import { base64Decode } from "@spotlight/ui/lib/base64";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import JsonViewer from "../../shared/JsonViewer";
import { CodeViewer } from "./CodeViewer";
import { inferExtension } from "./contentType";

const JSON_CONTENT_TYPES = new Set(["application/json", "text/json", "text/x-json", "application/ld+json"]);
const CODE_CONTENT_TYPES = new Set(["text/css", "text/html", "text/javascript"]);
const IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);
const VIDEO_CONTENT_TYPES = new Set(["video/mp4", "video/webm"]);

export default function Attachment({
  header,
  attachment,
  expanded = false,
}: {
  header: EnvelopeItem[0];
  attachment: string;
  expanded?: boolean;
}) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const extension = inferExtension(header.content_type as string | null, header.type as string | null);
  const name = (header.filename as string) || `untitled.${extension}`;

  const createDownloadUrl = useCallback(() => {
    const blob = new Blob(
      [
        IMAGE_CONTENT_TYPES.has(header.content_type as string) || VIDEO_CONTENT_TYPES.has(header.content_type as string)
          ? (base64Decode(attachment).buffer as BlobPart)
          : extension === "bin"
            ? atob(attachment)
            : attachment,
      ],
      { type: (header.content_type as string) || "application/octet-stream" },
    );
    const url = URL.createObjectURL(blob);
    setDownloadUrl(current => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return url;
    });
    return url;
  }, [attachment, extension, header.content_type]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    if (!downloadUrl) {
      createDownloadUrl();
    }
  }, [expanded, downloadUrl, createDownloadUrl]);

  useEffect(
    () => () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    },
    [downloadUrl],
  );

  let content: ReactNode = null;

  if (expanded) {
    if (header.content_type === "text/plain" || header.content_type === "text/csv") {
      content = (
        <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm rounded-sm bg-primary-900 p-2">
          {attachment}
        </pre>
      );
    } else if (JSON_CONTENT_TYPES.has(header.content_type as string)) {
      try {
        content = <JsonViewer data={JSON.parse(attachment)} collapsedDepth={2} />;
      } catch {
        content = (
          <pre className="text-destructive-400 whitespace-pre-wrap break-words font-mono text-sm rounded-sm bg-primary-900 p-2">
            Failed to parse JSON attachment.
          </pre>
        );
      }
    } else if (CODE_CONTENT_TYPES.has(header.content_type as string)) {
      content = <CodeViewer code={attachment} lang={extension} />;
    } else if (IMAGE_CONTENT_TYPES.has(header.content_type as string)) {
      content = downloadUrl ? <img className="size-full object-contain" src={downloadUrl} alt="Attachment" /> : null;
    } else if (VIDEO_CONTENT_TYPES.has(header.content_type as string)) {
      content = downloadUrl ? (
        <video className="size-full object-contain" controls>
          <source src={downloadUrl} type={header.content_type as string} />
        </video>
      ) : null;
    }
  }

  return (
    <>
      <h3>
        📎{" "}
        <a href={downloadUrl ?? undefined} download={name} className="group inline-flex items-center gap-1">
          {name}
          <Download className="inline h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100" />
        </a>
      </h3>
      {expanded ? content : <p className="text-primary-400 text-xs italic">Expand to preview attachment.</p>}
    </>
  );
}
