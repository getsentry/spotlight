import type { EnvelopeItem } from "@sentry/core";

export default function Attachment({ header, attachment }: { header: EnvelopeItem[0]; attachment: string }) {
  let text: string | null = null;
  if (header.content_type === "text/plain") {
    text = attachment;
    // @ts-expect-error ts(2367) -- statsd is an old and deprecated event type
  } else if (header.type! === "statsd") {
    text = atob(attachment);
  }

  return text != null ? (
    <pre className="text-primary-300 whitespace-pre-wrap break-words font-mono text-sm p-2 bg-primary-900 rounded-sm">
      {text}
    </pre>
  ) : (
    <img
      src={`data:${header.content_type};base64,${attachment}`}
      alt="Attachment"
      className="w-full h-full object-contain"
    />
  );
}
