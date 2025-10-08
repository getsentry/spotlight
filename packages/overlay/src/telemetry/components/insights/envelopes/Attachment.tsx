import type { EnvelopeItem } from "@sentry/core";
import { type ReactNode, useEffect, useMemo } from "react";
import { ReactComponent as Download } from "~/assets/download.svg";
import JsonViewer from "../../shared/JsonViewer";
import { useShiki } from "./useShiki";

const JSON_CONTENT_TYPES = new Set(["application/json", "text/json", "text/x-json", "application/ld+json"]);
const IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);

export default function Attachment({ header, attachment }: { header: EnvelopeItem[0]; attachment: string }) {
  let content: ReactNode | null = null;
  let extension = "bin";
  if (header.content_type === "text/plain" || header.content_type === "text/csv") {
    extension = header.content_type === "text/plain" ? "txt" : "csv";
    content = (
      <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm p-2 bg-primary-900 rounded-sm">
        {attachment}
      </pre>
    );
  } else if (JSON_CONTENT_TYPES.has(header.content_type as string)) {
    extension = "json";
    content = <JsonViewer data={JSON.parse(attachment)} />;
  } else if (header.content_type === "text/css") {
    extension = "css";
    content = <CodeViewer code={attachment} lang={extension} />;
  } else if (header.content_type === "text/html") {
    extension = "html";
    content = <CodeViewer code={attachment} lang={extension} />;
  } else if (header.content_type === "text/javascript") {
    extension = "js";
    content = <CodeViewer code={attachment} lang={extension} />;
  } else if (IMAGE_CONTENT_TYPES.has(header.content_type as string)) {
    extension = "bin";
    content = (
      <img
        className="size-full object-contain"
        src={`data:${header.content_type};base64,${atob(attachment)}`}
        alt="Attachment"
      />
    );
  }

  const name = (header.filename as string) || `untitled-attachment.${extension}`;

  const downloadUrl = useMemo(
    () =>
      URL.createObjectURL(
        new Blob([extension === "bin" ? atob(attachment) : attachment], {
          type: (header.content_type as string) || "application/octet-stream",
        }),
      ),
    [attachment, header.content_type, extension],
  );
  useEffect(() => () => URL.revokeObjectURL(downloadUrl), [downloadUrl]);

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

function CodeViewer({ code, lang }: { code: string; lang: string }) {
  const highlighter = useShiki();
  if (highlighter) {
    // biome-ignore lint/security/noDangerouslySetInnerHtml: Need this for shiki
    return <div dangerouslySetInnerHTML={{ __html: highlighter.codeToHtml(code, { lang, theme: "nord" }) }} />;
  }
  return (
    <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm p-2 bg-primary-900 rounded-sm">
      {code}
    </pre>
  );
}
