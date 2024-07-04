import { Envelope } from '@sentry/types';
import { useState } from 'react';
import { RawEventContext } from '~/integrations/integration';
import SidePanel, { SidePanelHeader } from '~/ui/SidePanel';
import JsonViewer from './JsonViewer';

export default function EnvelopeDetails({ data }: { data: { envelope: Envelope; rawEnvelope: RawEventContext } }) {
  const [showRawJSON, setShowRawJSON] = useState<boolean>(false);
  const { envelope, rawEnvelope } = data;
  const header = envelope[0];
  const items = envelope[1];
  return (
    <SidePanel backto="/devInfo">
      <SidePanelHeader
        title="Envelope Details"
        subtitle={
          <>
            {header.event_id && (
              <>
                Event Id <span className="text-primary-500">&mdash;</span> {header.event_id}
              </>
            )}
          </>
        }
        backto="/devInfo"
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
          <div className="bg-primary-400 h-4 w-10 rounded-full shadow-inner"></div>
          <div className="dot absolute -left-1 -top-1 h-6 w-6 rounded-full bg-white shadow transition"></div>
        </div>
        <span className="ml-2">Show Raw Data</span>
      </label>

      {showRawJSON ? (
        <div className="flex-1 overflow-y-auto">
          <JsonViewer data={rawEnvelope} />
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
