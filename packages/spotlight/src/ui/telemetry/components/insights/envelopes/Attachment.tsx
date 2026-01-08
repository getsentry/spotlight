import type { EnvelopeItem } from "@sentry/core";
import { ReactComponent as Download } from "@spotlight/ui/assets/download.svg";
import { base64Decode, safeAtob } from "@spotlight/ui/lib/base64";
import { type ReactNode, useEffect, useMemo } from "react";
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
  const extension = inferExtension(header.content_type as string | null, header.type as string | null);
  const name = (header.filename as string) || `untitled.${extension}`;

  // Create download URL for binary content types
  // Returns: string (success), null (decode error)
  const downloadUrl = useMemo(() => {
    if (!expanded) {
      return undefined; // Not needed yet
    }

    const contentType = header.content_type as string;
    let blobData: BlobPart;

    if (IMAGE_CONTENT_TYPES.has(contentType) || VIDEO_CONTENT_TYPES.has(contentType)) {
      const decoded = base64Decode(attachment);
      if (!decoded) {
        return null; // Decode error
      }
      blobData = decoded.buffer as BlobPart;
    } else if (extension === "bin") {
      const decoded = safeAtob(attachment);
      if (decoded === null) {
        return null; // Decode error
      }
      blobData = decoded;
    } else {
      return undefined; // Not a binary type, no blob URL needed
    }

    const blob = new Blob([blobData], { type: contentType || "application/octet-stream" });
    return URL.createObjectURL(blob);
  }, [expanded, attachment, extension, header.content_type]);

  // Cleanup blob URL on unmount or when URL changes
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const decodeError = downloadUrl === null;

  let content: ReactNode = null;

  if (expanded) {
    if (decodeError) {
      content = (
        <pre className="text-destructive-400 whitespace-pre-wrap break-words font-mono text-sm rounded-sm bg-primary-900 p-2">
          Failed to decode attachment data. The base64 data may be corrupted or invalid.
        </pre>
      );
    } else if (header.content_type === "text/plain" || header.content_type === "text/csv") {
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
