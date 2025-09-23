import type { EnvelopeItem } from "@sentry/core";

export default function Attachment({ header, attachment }: { header: EnvelopeItem[0]; attachment: string }) {
  if (header.content_type === "text/plain") {
    return (
      <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm p-2 bg-primary-900 rounded-sm">
        {attachment}
      </pre>
    );
  }

  const src = `data:${header.content_type};base64,${atob(attachment)}`;

  return <img src={src} alt="Attachment" className="w-full h-full object-contain" />;
}
