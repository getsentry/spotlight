import { Link, useParams } from "react-router-dom";
import { cn } from "~/lib/cn";
import CardList from "~/telemetry/components/shared/CardList";
import TimeSince from "~/telemetry/components/shared/TimeSince";
import { isLocalTrace } from "~/telemetry/store/helpers";
import { Badge } from "~/ui/badge";
import { useSentryEnvelopes } from "../../../data/useSentryEnvelopes";
import useSentryStore from "../../../store";
import { sdkToPlatform } from "../../../utils/sdkToPlatform";
import { truncateId } from "../../../utils/text";
import PlatformIcon from "../../shared/PlatformIcon";
import EnvelopeDetails from "./EnvelopeDetails";

export default function EnvelopeList({ showAll }: { showAll: boolean }) {
  const { id: selectedEnvelopeId } = useParams();
  const { allEnvelopes, localEnvelopes } = useSentryEnvelopes();
  const { getEnvelopeById } = useSentryStore();

  const selectedEnvelope = selectedEnvelopeId ? getEnvelopeById(selectedEnvelopeId) : null;

  if (allEnvelopes?.length) {
    return (
      <>
        <CardList>
          <div className="flex flex-col">
            {(showAll ? allEnvelopes : localEnvelopes).map(envelope => {
              const [header, envelopeItems = []] = envelope;
              const envelopeId: string | unknown = header.__spotlight_envelope_id;
              if (typeof envelopeId !== "string") {
                return null;
              }
              const { trace_id } = (header?.trace as { trace_id?: string }) || {};
              const itemTypes = new Set<string | undefined>(envelopeItems.map(item => item?.[0].type));
              itemTypes.delete(undefined);
              const itemTypesList = Array.from(itemTypes).join(",");

              return (
                <Link key={envelopeId} to={`/insights/envelopes/${envelopeId}`}>
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
                        {trace_id && isLocalTrace(trace_id) ? (
                          <Badge title="This trace is part of your local session.">Local</Badge>
                        ) : null}
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
  return <p className="text-primary-300 px-6 py-4">No Envelopes found.</p>;
}
