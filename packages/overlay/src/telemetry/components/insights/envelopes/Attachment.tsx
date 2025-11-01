import type { EnvelopeItem } from "@sentry/core";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ReactComponent as Download } from "~/assets/download.svg";
import { base64Decode } from "~/lib/base64";
import JsonViewer from "../../shared/JsonViewer";
import { CodeViewer } from "./CodeViewer";

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
  const extension = JSON_CONTENT_TYPES.has(header.content_type as string)
    ? "json"
    : CODE_CONTENT_TYPES.has(header.content_type as string)
      ? "txt"
      : "bin";
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

  const ensureDownloadReady = useCallback(() => {
    if (!downloadUrl) {
      return createDownloadUrl();
    }
    return downloadUrl;
  }, [createDownloadUrl, downloadUrl]);

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
      const preparedUrl = downloadUrl ?? ensureDownloadReady();
      content = preparedUrl ? <img className="size-full object-contain" src={preparedUrl} alt="Attachment" /> : null;
    } else if (VIDEO_CONTENT_TYPES.has(header.content_type as string)) {
      const preparedUrl = downloadUrl ?? ensureDownloadReady();
      content = preparedUrl ? (
        <video className="size-full object-contain" controls>
          <source src={preparedUrl} type={header.content_type as string} />
        </video>
      ) : null;
    }
  }

  return (
    <>
      <h3>
        📎{" "}
        <a
          href={downloadUrl ?? undefined}
          onMouseEnter={ensureDownloadReady}
          onFocus={ensureDownloadReady}
          onClick={ensureDownloadReady}
          download={name}
          className="group inline-flex items-center gap-1"
        >
          {name}
          <Download className="inline h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100" />
        </a>
      </h3>
      {expanded ? content : <p className="text-primary-400 text-xs italic">Expand to preview attachment.</p>}
    </>
  );
}
