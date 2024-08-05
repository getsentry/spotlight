import { useState } from 'react';
import { Link, Outlet, Route, Routes, useParams } from 'react-router-dom';
import Tabs from '../../../../components/Tabs';
import sentryDataCache from '../../data/sentryDataCache';
import { SentryEvent } from '../../types';
import PlatformIcon from '../PlatformIcon';
import Event, { EventTitle } from './Event';
import EventBreadcrumbs from './EventBreadcrumbs';
import EventContexts from './EventContexts';

function renderEvent(event: SentryEvent) {
  return <Event event={event} />;
}

function renderEventTitle(event: SentryEvent) {
  return <EventTitle event={event} />;
}

export default function EventDetails() {
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState('details');

  if (!eventId) {
    return <p className="text-primary-300 p-6">Unknown event id</p>;
  }

  const event = sentryDataCache.getEventById(eventId);

  if (!event) {
    return <p className="text-primary-300 p-6">Event not found.</p>;
  }

  const tabs = [
    {
      id: 'details',
      title: 'Details',
      active: activeTab === 'details',
      onSelect: () => setActiveTab('details'),
    },
    {
      id: 'breadcrumbs',
      title: 'Breadcrumbs',
      active: activeTab === 'breadcrumbs',
      onSelect: () => setActiveTab('breadcrumbs'),
    },
    {
      id: 'contexts',
      title: 'Context',
      active: activeTab === 'contexts',
      onSelect: () => setActiveTab('contexts'),
    },
  ];

  const traceCtx = event.contexts?.trace;
  return (
    <>
      <div className="bg-primary-950 flex items-center gap-x-2 px-6 py-4">
        <PlatformIcon event={event} className="rounded-md" />
        <h1 className="max-w-full flex-1 truncate text-2xl">{renderEventTitle(event)}</h1>
        {traceCtx && (
          <div className="text-primary-300 font-mono">
            <div>
              T:{' '}
              <Link className="cursor-pointer underline" to={`/traces/${traceCtx.trace_id}`}>
                {traceCtx.trace_id}
              </Link>
            </div>
            <div>
              S:{' '}
              <Link className="cursor-pointer underline" to={`/traces/${traceCtx.trace_id}/${traceCtx.span_id}`}>
                {traceCtx.span_id}
              </Link>
            </div>
          </div>
        )}
      </div>
      <Tabs tabs={tabs} nested={true} />
      <div className="flex-1 px-6 py-4">
        <Routes>
          <Route path="breadcrumbs" element={<EventBreadcrumbs event={event} />} />
          <Route path="contexts" element={<EventContexts event={event} />} />
          {/* Default tab */}
          <Route path="*" element={renderEvent(event)} />
        </Routes>
        <Outlet />
      </div>
    </>
  );
}
