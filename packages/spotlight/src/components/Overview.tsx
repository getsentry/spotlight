import { useState } from 'react';
import { useNavigation } from '~/lib/useNavigation';
import Tabs from './Tabs';

const DEFAULT_TAB = 'errors';

export default function Overview({ integrationData }: { integrationData: Record<string, Array<unknown>> }) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  const { integrations } = useNavigation();

  const tabs = integrations
    .map(integration => {
      if (integration.tabs) {
        return integration.tabs.map(tab => ({
          ...tab,
          active: activeTab === tab.id,
          onSelect: () => {
            // setEventId(null);
            // setTraceId(null);
            setActiveTab(tab.id);
          },
        }));
      }
      return [];
    })
    .flat();

  const TabContent =
    tabs.find(tab => tab.id === activeTab)?.content || (() => <p>This tab doesn't seem to display anything (yet).</p>);

  return (
    <>
      <Tabs tabs={tabs} />
      <TabContent integrationData={integrationData} />
    </>
  );
}
