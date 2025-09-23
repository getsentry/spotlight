import type { Envelope } from "@sentry/core";
import { useState } from "react";
import { ReactComponent as Download } from "~/assets/download.svg";
import { useSpotlightContext } from "~/lib/useSpotlightContext";
import JsonViewer from "~/telemetry/components/shared/JsonViewer";
import SidePanel, { SidePanelHeader } from "~/ui/sidePanel";
import Attachment from "./Attachment";

export default function EnvelopeDetails({ envelope }: { envelope: Envelope }) {
  const [showRawJSON, setShowRawJSON] = useState<boolean>(false);
  const { getSidecarUrl } = useSpotlightContext();

  const [header, items] = envelope;

  const envelopeId: string | unknown = header.__spotlight_envelope_id;

  const downloadUrl = getSidecarUrl(`/envelope/${envelopeId}`);
  return (
    <SidePanel backto="/telemetry/insights/envelopes">
      <SidePanelHeader
        title="Envelope Details"
        subtitle={
          <>
            Envelope Id <span className="text-primary-500">&mdash;</span>{" "}
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1 group"
              title="Download"
              aria-label="Download envelope"
            >
              {String(envelopeId)}
              <Download className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
          </>
        }
        backto="/telemetry/insights/envelopes"
      />
      <label htmlFor="json-toggle" className="mb-8 flex cursor-pointer items-center">
        <div className="relative flex h-4 items-center gap-2">
          <input
            id="json-toggle"
            type="checkbox"
            className="sr-only"
            onChange={() => setShowRawJSON(prev => !prev)}
            checked={showRawJSON}
          />
          <div className="bg-primary-400 h-4 w-10 rounded-full shadow-inner" />
          <div className="dot absolute -left-1 -top-1 h-6 w-6 rounded-full bg-white shadow transition" />
        </div>
        <span className="ml-2">Show Raw Data</span>
      </label>

      {showRawJSON ? (
        <div className="flex-1 overflow-y-auto">
          <JsonViewer data={envelope} />
        </div>
      ) : (
        <div className="flex flex-col gap-6 space-y-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Header</h2>
            <JsonViewer data={header} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="mb-2 text-xl font-semibold">Items</h2>
            {items.map((item, ind) => {
              if (item[0].type === "attachment") {
                return <Attachment key={`${ind}-${item[0]?.type}`} header={item[0]} attachment={item[1].data} />;
              }

              return <JsonViewer key={`${ind}-${item[0]?.type}`} data={item} />;
            })}
          </div>
        </div>
      )}
    </SidePanel>
  );
}
