import { useState } from 'react';
import Tabs from './Tabs';
import useKeyPress from '~/lib/useKeyPress';
import dataCache from '~/lib/dataCache';
import { useNavigation } from '~/lib/useNavigation';
import EventDetails from '~/integrations/sentry/components/EventDetails';
import TraceDetails from '~/integrations/sentry/components/TraceDetails';

const DEFAULT_TAB = 'errors';

export default function Overview({ integrationData }: { integrationData: Record<string, Array<unknown>> }) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  const { integrations, traceId, setTraceId, eventId, setEventId, setSpanId } = useNavigation();

  useKeyPress('Escape', () => {
    setEventId(null);
    setTraceId(null);
    setSpanId(null);
  });

  const tabs = integrations
    .map(integration => {
      if (integration.tabs) {
        return integration.tabs.map(tab => ({
          ...tab,
          active: activeTab === tab.id,
          onSelect: () => {
            setEventId(null);
            setTraceId(null);
            setActiveTab(tab.id);
          },
        }));
      }
      return [];
    })
    .flat();

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
      <TabContent integrationData={integrationData} />
    </>
  );
}
