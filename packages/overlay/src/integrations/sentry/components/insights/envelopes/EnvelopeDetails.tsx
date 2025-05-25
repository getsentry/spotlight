import type { Envelope } from '@sentry/core';
import { useState } from 'react';
import type { RawEventContext } from '~/integrations/integration';
import { parseStringFromBuffer } from '~/integrations/sentry/utils/bufferParsers';
import SidePanel, { SidePanelHeader } from '~/ui/SidePanel';
import JsonViewer from '../../../../../components/JsonViewer';

export default function EnvelopeDetails({ data }: { data: { envelope: Envelope; rawEnvelope: RawEventContext } }) {
  const [showRawJSON, setShowRawJSON] = useState<boolean>(false);
  const { envelope, rawEnvelope } = data;

  const header = envelope[0];
  const items = envelope[1];

  const rawEnvelopeData = {
    ...rawEnvelope,
    data: typeof rawEnvelope.data === 'string' ? rawEnvelope.data : parseStringFromBuffer(rawEnvelope.data),
  };

  const envelopeId: string | unknown = header.__spotlight_envelope_id;
  const downloadUrl = URL.createObjectURL(new Blob([rawEnvelope.data], { type: rawEnvelope.contentType }));
  const downloadName = `${envelopeId}-${rawEnvelope.contentType}.bin`;
  return (
    <SidePanel backto="/insights/envelopes">
      <SidePanelHeader
        title="Envelope Details"
        subtitle={
          <>
            Event Id <span className="text-primary-500">&mdash;</span>{' '}
            <a href={downloadUrl} download={downloadName}>
              {String(envelopeId)}
            </a>
          </>
        }
        backto="/insights/envelopes"
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
          <JsonViewer data={rawEnvelopeData} />
        </div>
      ) : (
        <div className="flex flex-col gap-6 space-y-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Header</h2>
            <JsonViewer data={header} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="mb-2 text-xl font-semibold">Items</h2>
            {items.map((item, ind) => (
              <JsonViewer key={`${ind}-${item[0]?.type}`} data={item} />
            ))}
          </div>
        </div>
      )}
    </SidePanel>
  );
}
