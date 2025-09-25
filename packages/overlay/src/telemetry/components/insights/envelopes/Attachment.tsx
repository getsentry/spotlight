import type { EnvelopeItem } from "@sentry/core";
import JsonViewer from "../../shared/JsonViewer";
import type { ReactNode } from "react";

export default function Attachment({ header, attachment }: { header: EnvelopeItem[0]; attachment: string }) {
  let content: ReactNode | null = null;
  const name = (header.filename as string) || "<unknown>";
  if (header.content_type === "text/plain") {
    content = (
      <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm p-2 bg-primary-900 rounded-sm">
        {attachment}
      </pre>
    );
  } else if (header.content_type === "application/json") {
    content = <JsonViewer data={JSON.parse(attachment)} />;
  }

  return (
    <>
      <h3>📎 {name}</h3>
      {content}
    </>
  );
}
