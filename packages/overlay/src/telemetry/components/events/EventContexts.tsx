import type { Nullable } from "vitest";
import type { SentryEvent } from "../../types";
import Attachment from "../insights/envelopes/Attachment";
import { CodeViewer } from "../insights/envelopes/CodeViewer";
import { ContextView } from "../shared/ContextView";

const EXAMPLE_CONTEXT = `Sentry.setContext("character", {
  name: "Mighty Fighter",
  age: 19,
  attack_type: "melee",
});`;

const exampleContext = (
  <div className="space-y-4 px-6 py-4">
    <div className="text-primary-300">
      No context available for this event. Try adding some to make debugging easier.
    </div>
    <CodeViewer code={EXAMPLE_CONTEXT} lang="js" />
  </div>
);

export default function EventContexts({ event }: { event: SentryEvent }) {
  if (!event) {
    return exampleContext;
  }

  const contexts: Record<string, Nullable<Record<string, unknown>>> = {
    request: event.request,
    ...event.contexts,
  };

  if (event.extra) {
    contexts.extra = event.extra;
  }

  if (event.modules) {
    contexts.extra = Object.assign(contexts.extra || {}, { modules: event.modules });
  }

  const contextEntries = Object.entries(contexts).filter(entry => entry[1]) as [string, Record<string, unknown>][];
  if (contextEntries.length === 0 && !event.tags && !event.attachments?.length) {
    return exampleContext;
  }

  return (
    <>
      <ContextView context={contextEntries} tags={event.tags} />
      {event.attachments && event.attachments.length > 0 && (
        <div className="space-y-4 px-6 py-4">
          <h2 className="mb-2 font-bold uppercase">Attachments</h2>
          {event.attachments.map((attachment, index) => (
            <Attachment key={`${index}-${attachment.header.type}`} header={attachment.header} attachment={attachment.data} />
          ))}
        </div>
      )}
    </>
  );
}
