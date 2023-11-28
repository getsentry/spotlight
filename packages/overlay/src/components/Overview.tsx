import { createElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Integration, IntegrationData } from '~/integrations/integration';
import Tabs from './Tabs';

export default function Overview({
  integrations,
  integrationData,
}: {
  integrations: Integration[];
  integrationData: IntegrationData<unknown>;
}) {
  const tabs = integrations
    .map(integration => {
      if (integration.tabs) {
        const processedEvents = integrationData[integration.name]?.map(container => container.event) || [];
        return integration.tabs({ processedEvents }).map(tab => ({
          ...tab,
          processedEvents: processedEvents,
        }));
      }
      return [];
    })
    .flat();

  const initialTab = tabs.length ? `/${tabs[0].id}` : '/no-tabs';

  return (
    <>
      <MemoryRouter initialEntries={[initialTab]}>
        <Tabs tabs={tabs} />
        <Routes>
          <Route path="/not-found" element={<p>Not Found - How'd you manage to get here?</p>} key={'not-found'}></Route>
          {tabs.map(tab => {
            const TabContent = tab.content && tab.content;

            if (TabContent) {
              return (
                <Route
                  path={`/${tab.id}/*`}
                  key={tab.id}
                  element={createElement(TabContent, { processedEvents: tab.processedEvents })}
                ></Route>
              );
            }
            return null;
          })}
        </Routes>
      </MemoryRouter>
    </>
  );
}
