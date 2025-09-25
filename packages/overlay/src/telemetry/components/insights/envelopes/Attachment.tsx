import type { EnvelopeItem } from "@sentry/core";
import { type ReactNode, useEffect, useMemo } from "react";
import { ReactComponent as Download } from "~/assets/download.svg";
import JsonViewer from "../../shared/JsonViewer";

export default function Attachment({ header, attachment }: { header: EnvelopeItem[0]; attachment: string }) {
  let content: ReactNode | null = null;
  let extension = "bin";
  if (header.content_type === "text/plain") {
    extension = "txt";
    content = (
      <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm p-2 bg-primary-900 rounded-sm">
        {attachment}
      </pre>
    );
  } else if (header.content_type === "application/json") {
    extension = "json";
    content = <JsonViewer data={JSON.parse(attachment)} />;
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
