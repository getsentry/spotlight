import type { Envelope } from "@sentry/core";
import { cn } from "@spotlight/ui/lib/cn";
import CardList from "@spotlight/ui/telemetry/components/shared/CardList";
import TimeSince from "@spotlight/ui/telemetry/components/shared/TimeSince";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@spotlight/ui/ui/empty";
import { Link, useParams } from "react-router-dom";
import { useSentryEnvelopes } from "../../../data/useSentryEnvelopes";
import useSentryStore from "../../../store";
import { sdkToPlatform } from "../../../utils/sdkToPlatform";
import { truncateId } from "../../../utils/text";
import PlatformIcon from "../../shared/PlatformIcon";
import EnvelopeDetails from "./EnvelopeDetails";

export default function EnvelopeList() {
  const { id: selectedEnvelopeId } = useParams();
  const allEnvelopes = useSentryEnvelopes();
  const { getEnvelopeById } = useSentryStore();

  const selectedEnvelope = selectedEnvelopeId ? getEnvelopeById(selectedEnvelopeId) : null;

  if (allEnvelopes?.length) {
    return (
      <>
        <CardList>
          <div className="flex flex-col">
            {allEnvelopes.map((envelope: Envelope) => {
              const [header, envelopeItems = []] = envelope;
              const envelopeId: string | unknown = header.__spotlight_envelope_id;
              if (typeof envelopeId !== "string") {
                return null;
              }
              const itemTypes = new Set<string | undefined>(envelopeItems.map(item => item?.[0].type));
              itemTypes.delete(undefined);
              const itemTypesList = Array.from(itemTypes).join(",");

              return (
                <Link key={envelopeId} to={`/telemetry/insights/envelopes/${envelopeId}`}>
                  <div
                    className={cn(
                      "hover:bg-primary-900 border-b-primary-900 flex cursor-pointer items-center gap-4 border-b px-6 py-2 transition-all",
                      selectedEnvelopeId === envelopeId ? "bg-primary-900" : "",
                    )}
                  >
                    <PlatformIcon className="rounded-md" platform={sdkToPlatform(header.sdk?.name || "unknown")} />
                    <div className="text-primary-300 flex flex-[0.25] flex-col truncate font-mono text-sm">
                      <h2 className="text-primary-50 text-xs">Envelope Id</h2>
                      <div className="flex items-center gap-x-2">
                        <div>{truncateId(envelopeId)}</div>
                      </div>
                    </div>

                    <div className="text-primary-300 flex flex-[0.25] flex-col truncate font-mono text-sm">
                      <h2 className="text-primary-50 text-xs">Event Types</h2>
                      <span title={itemTypesList}>{itemTypesList || "-"}</span>
                    </div>
                    <div className="text-primary-300 flex flex-[0.25] flex-col truncate font-mono text-sm">
                      <h2 className="text-primary-50 text-xs">Received</h2>
                      {(header.sent_at as string | Date | number) ? (
                        <TimeSince date={header.sent_at as string | Date | number} />
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardList>
        {selectedEnvelope && <EnvelopeDetails envelope={selectedEnvelope} />}
      </>
    );
  }
  return (
    <Empty className="min-h-screen">
      <EmptyHeader>
        <EmptyTitle>No Envelopes</EmptyTitle>
        <EmptyDescription>
          Make sure you have setuped Sentry in your project and enabled Spotlight integration
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-4">
          <a
            href="https://docs.sentry.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary-400"
          >
            Sentry Docs
          </a>
          <a
            href="https://spotlightjs.com/docs/setup/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary-400"
          >
            Spotlight Docs
          </a>
        </div>
      </EmptyContent>
    </Empty>
  );
}
