import { Envelope, EnvelopeItem } from '@sentry/types';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TimeSince from '~/components/TimeSince';
import classNames from '~/lib/classNames';
import { useSpotlightContext } from '~/lib/useSpotlightContext';
import Badge from '~/ui/Badge';
import sentryDataCache from '../../data/sentryDataCache';
import { useSentryEnvelopes } from '../../data/useSentryEnvelopes';
import { useSentryHelpers } from '../../data/useSentryHelpers';
import { sdkToPlatform } from '../../utils/sdkToPlatform';
import HiddenItemsButton from '../HiddenItemsButton';
import PlatformIcon from '../PlatformIcon';
import EnvelopeDetails from './EnvelopeDetails';

export default function EnvelopeList() {
  const { eventId } = useParams();
  const context = useSpotlightContext();
  const helpers = useSentryHelpers();
  const { allEnvelopes, localEnvelopes } = useSentryEnvelopes();
  const hiddenItemCount = allEnvelopes.length - localEnvelopes.length;

  const [showAll, setShowAll] = useState(!context.experiments['sentry:focus-local-events']);

  const selectedEnvelope = eventId
    ? sentryDataCache.getEnvelopes().find(({ envelope: _env }) => _env[0].event_id === eventId) || null
    : null;

  if (allEnvelopes?.length) {
    return (
      <>
        {hiddenItemCount > 0 && !showAll && (
          <HiddenItemsButton
            itemCount={hiddenItemCount}
            onClick={() => {
              setShowAll(true);
            }}
          />
        )}
        <div>
          <div className="border-b-primary-700 flex w-full items-center justify-between border-b px-6 py-4">
            <h1 className="text-2xl font-bold">Event Envelopes</h1>
          </div>
          <div className="flex flex-col">
            {(showAll ? allEnvelopes : localEnvelopes).map(({ envelope }: { envelope: Envelope }) => {
              const header: Envelope[0] = envelope[0];
              const envelopeEventId: string | unknown = header.event_id;
              const { trace_id } = (header?.trace as { trace_id?: string }) || {};
              const envelopeItem = envelope[1].length > 0 ? (envelope[1][0] as EnvelopeItem) : null;
              if (typeof envelopeEventId !== 'string') {
                return null;
              }
              return (
                <Link key={envelopeEventId} to={`/explore/devInfo/${header.event_id}`}>
                  <div
                    className={classNames(
                      'hover:bg-primary-900 border-b-primary-900 flex cursor-pointer items-center gap-4 border-b px-6 py-2 transition-all',
                      eventId === envelopeEventId ? 'bg-primary-900' : '',
                    )}
                  >
                    <PlatformIcon className="rounded-md" platform={sdkToPlatform(header.sdk?.name || 'unknown')} />
                    <div className="text-primary-300 flex flex-[0.25] flex-col truncate font-mono text-sm">
                      <h2 className="text-primary-50 text-xs">Event Id</h2>
                      <div className="flex items-center gap-x-2">
                        <div>{envelopeEventId.substring(0, 8)}</div>
                        {trace_id && helpers.isLocalToSession(trace_id) ? (
                          <Badge title="This trace is part of your local session.">Local</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-primary-300 flex flex-[0.25] flex-col truncate font-mono text-sm">
                      <h2 className="text-primary-50 text-xs">Type</h2>
                      {envelopeItem?.[0]?.type ? envelopeItem[0].type : '-'}
                    </div>
                    <div className="text-primary-300 flex flex-[0.25] flex-col truncate font-mono text-sm">
                      <h2 className="text-primary-50 text-xs">Received</h2>
                      {(header.sent_at as string | Date | number) ? (
                        <TimeSince date={header.sent_at as string | Date | number} />
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        {selectedEnvelope && <EnvelopeDetails data={selectedEnvelope} />}
      </>
    );
  }
  return <p className="text-primary-300 px-6 py-4">No Envelopes found.</p>;
}
