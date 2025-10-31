import type { EnvelopeItem } from "@sentry/core";
import { type ReactNode, useEffect, useState } from "react";
import { ReactComponent as Download } from "~/assets/download.svg";
import { base64Decode } from "~/lib/base64";
import JsonViewer from "../../shared/JsonViewer";
import { CodeViewer } from "./CodeViewer";

const JSON_CONTENT_TYPES = new Set(["application/json", "text/json", "text/x-json", "application/ld+json"]);
const CODE_CONTENT_TYPES = new Set(["text/css", "text/html", "text/javascript"]);
const IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);
const VIDEO_CONTENT_TYPES = new Set(["video/mp4", "video/webm"]);

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
  // Video
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export default function Attachment({ header, attachment }: { header: EnvelopeItem[0]; attachment: string }) {
  let content: ReactNode | null = null;
  const extension = CONTENT_TYPES_TO_EXTENSION[header.content_type as keyof typeof CONTENT_TYPES_TO_EXTENSION] ?? "bin";

  const name = (header.filename as string) || `untitled-attachment.${extension}`;

  const [isLoading, setIsLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Process blob creation asynchronously to avoid blocking the main thread
    const createBlobUrl = async () => {
      // Use setTimeout to defer heavy processing
      await new Promise(resolve => setTimeout(resolve, 0));

      if (!isMounted) return;

      const blobPart =
        IMAGE_CONTENT_TYPES.has(header.content_type as string) || VIDEO_CONTENT_TYPES.has(header.content_type as string)
          ? (base64Decode(attachment).buffer as BlobPart)
          : extension === "bin"
            ? atob(attachment)
            : attachment;

      const blob = new Blob([blobPart], {
        type: (header.content_type as string) || "application/octet-stream",
      });

      const url = URL.createObjectURL(blob);

      if (isMounted) {
        setDownloadUrl(url);
        setIsLoading(false);
      } else {
        // Clean up if component unmounted during processing
        URL.revokeObjectURL(url);
      }
    };

    createBlobUrl();

    return () => {
      isMounted = false;
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [attachment, header.content_type, extension]);

  const isProcessingThePayload = isLoading || !downloadUrl;

  // For lightweight content types (text, JSON, code), no async loading needed
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
    content = (
      <LoadingSkeleton isLoading={isProcessingThePayload} loadingText="Loading image...">
        <img className="size-full object-contain" src={downloadUrl ?? ""} alt="Attachment" />
      </LoadingSkeleton>
    );
  } else if (VIDEO_CONTENT_TYPES.has(header.content_type as string)) {
    content = (
      <LoadingSkeleton isLoading={isProcessingThePayload} loadingText="Loading video...">
        <video className="size-full object-contain" controls>
          <source src={downloadUrl ?? ""} type={header.content_type as string} />
        </video>
      </LoadingSkeleton>
    );
  }

  return (
    <>
      <h3>
        📎{" "}
        {isProcessingThePayload ? (
          <span className="opacity-60">{name} (preparing download...)</span>
        ) : (
          <a href={downloadUrl} download={name}>
            {name} <Download className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity inline" />
          </a>
        )}
      </h3>
      {content}
    </>
  );
}

type LoadingSkeletonProps = {
  isLoading: boolean;
  loadingText: string;
  children: ReactNode;
};

function LoadingSkeleton(props: LoadingSkeletonProps) {
  const { isLoading, loadingText, children } = props;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-primary-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">{loadingText}</span>
        </div>
      </div>
    );
  }

  return children;
}
