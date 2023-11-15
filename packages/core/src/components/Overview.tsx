import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Integration, IntegrationData } from '~/integrations/integration';
import Tabs from './Tabs';

const DEFAULT_TAB = 'errors';

export default function Overview({
  integrations,
  integrationData,
}: {
  integrations: Integration[];
  integrationData: IntegrationData<unknown>;
}) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  const tabs = integrations
    .map(integration => {
      if (integration.tabs) {
        const processedEvents = integrationData[integration.name]?.map(container => container.event) || [];
        return integration.tabs({ processedEvents }).map(tab => ({
          ...tab,
          active: activeTab === tab.id,
          onSelect: () => {
            setActiveTab(tab.id);
          },
          processedEvents: processedEvents,
        }));
      }
      return [];
    })
    .flat();

  const initalTab = tabs.length ? `/${tabs[0].id}` : '/no-tabs';

  return (
    <>
      <MemoryRouter initialEntries={[initalTab]}>
        <Tabs tabs={tabs} />
        <Routes>
          <Route path="/not-found" element={<p>not fount</p>} key={'not-found'}></Route>
          {tabs.map(tab => {
            const TabContent =
              (tab.content && tab.content) || (() => <p>This tab doesn't seem to display anything (yet).</p>);

            return (
              <Route
                path={`/${tab.id}/*`}
                key={tab.id}
                element={<TabContent processedEvents={tab.processedEvents} key={tab.id} />}
              ></Route>
            );
          })}
        </Routes>
      </MemoryRouter>
    </>
  );
}
