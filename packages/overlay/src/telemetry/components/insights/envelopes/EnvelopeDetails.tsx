import type { Envelope } from "@sentry/core";
import { RAW_TYPES } from "@spotlightjs/sidecar/constants";
import { useMemo, useState } from "react";
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
          <JsonViewer data={envelope} collapsedDepth={1} />
        </div>
      ) : (
        <div className="flex flex-col gap-6 space-y-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Header</h2>
            <JsonViewer data={header} collapsedDepth={1} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="mb-2 text-xl font-semibold">Items</h2>
            <div className="flex flex-col divide-y divide-primary-900 overflow-hidden rounded-md border border-primary-900">
              {items.map((item, index) => (
                <EnvelopeItemPanel key={`${index}-${item[0]?.type ?? "unknown"}`} item={item} index={index} />
              ))}
            </div>
          </div>
        </div>
      )}
    </SidePanel>
  );
}

type EnvelopeItem = Envelope[1][number];

function EnvelopeItemPanel({ item, index }: { item: EnvelopeItem; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const itemHeader = item[0];

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (itemHeader.type) {
      parts.push(itemHeader.type);
    }
    if (itemHeader.content_type) {
      parts.push(String(itemHeader.content_type));
    }
    if (typeof itemHeader.length === "number") {
      parts.push(`${itemHeader.length} bytes`);
    }
    return parts.join(" • ");
  }, [itemHeader]);

  const payloadForViewer = useMemo(() => {
    const rawPayload = item[1];
    if (rawPayload && typeof rawPayload === "object") {
      return rawPayload as Record<string, unknown>;
    }

    return { value: rawPayload } as Record<string, unknown>;
  }, [item]);

  const toggle = () => setIsOpen(open => !open);
  const contentId = `envelope-item-${index}`;

  return (
    <div className="bg-primary-950">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-primary-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-primary-50">{itemHeader.type || `Item ${index + 1}`}</span>
          <span className="text-xs text-primary-300">{summary || "(no metadata)"}</span>
        </div>
        <span className="text-primary-300 text-xl" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen ? (
        <div id={contentId} className="space-y-4 px-4 pb-4">
          <div>
            <h3 className="mb-2 text-primary-100 text-sm font-semibold uppercase">Header</h3>
            <JsonViewer data={itemHeader as Record<string, unknown>} collapsedDepth={1} />
          </div>
          <div>
            <h3 className="mb-2 text-primary-100 text-sm font-semibold uppercase">Payload</h3>
            {RAW_TYPES.has(itemHeader.type) ? (
              // @ts-expect-error -- to be addressed when attachment typing is improved
              <Attachment header={itemHeader} attachment={item[1].data as string} expanded />
            ) : (
              <JsonViewer data={payloadForViewer} collapsedDepth={2} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
