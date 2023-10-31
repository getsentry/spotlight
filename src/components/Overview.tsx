import { useState } from 'react';
import { useSentryEvents } from '../lib/useSentryEvents';
import Tabs from './Tabs';
import TraceList from './TraceList';
import EventList from './EventList';
import useKeyPress from '~/lib/useKeyPress';
import EventDetails from './EventDetails';
import TraceDetails from './TraceDetails';
import dataCache from '~/lib/dataCache';
import { useNavigation } from '~/lib/useNavigation';
import SdkList from './SdkList';
import { useSentryTraces } from '~/lib/useSentryTraces';
import { IntegrationTab } from '~/integrations/integration';

const DEFAULT_TAB = 'errors';

export default function Overview({ integrationData }: { integrationData: Record<string, Array<unknown>> }) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  const events = useSentryEvents();
  const traces = useSentryTraces();

  const { integrations, traceId, setTraceId, eventId, setEventId, setSpanId } = useNavigation();

  useKeyPress('Escape', () => {
    setEventId(null);
    setTraceId(null);
    setSpanId(null);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabs: IntegrationTab<any>[] = [
    {
      id: 'errors',
      title: 'Errors',
      count: events.filter(e => 'exception' in e).length,
      active: activeTab === 'errors' && (!traceId || !!eventId),
      onSelect: () => {
        setEventId(null);
        setTraceId(null);
        setActiveTab('errors');
      },
    },
    {
      id: 'traces',
      title: 'Traces',
      count: traces.length,
      active: activeTab === 'traces' && (!eventId || !!traceId),
      onSelect: () => {
        setEventId(null);
        setTraceId(null);
        setActiveTab('traces');
      },
    },
    {
      id: 'sdks',
      title: 'SDKs',
      active: activeTab === 'sdks' && !eventId && !traceId,
      onSelect: () => {
        setEventId(null);
        setTraceId(null);
        setActiveTab('sdks');
      },
    },
  ];

  integrations.forEach(integration => {
    if (integration.tabs) {
      integration.tabs.forEach(tab => {
        tabs.push({
          ...tab,
          active: activeTab === tab.id,
          onSelect: () => {
            setEventId(null);
            setTraceId(null);
            setActiveTab(tab.id);
          },
        });
      });
    }
  });

  if (eventId) {
    const activeEvent = dataCache.getEventById(eventId);
    if (activeEvent) {
      return (
        <>
          <Tabs tabs={tabs} />
          <EventDetails event={activeEvent} />
        </>
      );
    }
  }

  if (traceId) {
    const activeTrace = dataCache.getTraceById(traceId);
    if (activeTrace) {
      return (
        <>
          <Tabs tabs={tabs} />
          <TraceDetails trace={activeTrace} />
        </>
      );
    }
  }

  const TabContent =
    tabs.find(tab => tab.id === activeTab)?.content || (() => <p>This tab doesn't seem to display anything (yet).</p>);

  return (
    <>
      <Tabs tabs={tabs} />
      {activeTab === 'traces' ? (
        <TraceList />
      ) : activeTab === 'errors' ? (
        <EventList events={events} />
      ) : activeTab === 'sdks' ? (
        <SdkList />
      ) : (
        <TabContent integrationData={integrationData} />
      )}
    </>
  );
}
