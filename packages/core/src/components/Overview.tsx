import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Integration } from '~/integrations/integration';
import Tabs from './Tabs';

const DEFAULT_TAB = 'errors';

export default function Overview({
  integrations,
  integrationData,
}: {
  integrations: Integration[];
  integrationData: Record<string, Array<unknown>>;
}) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  const tabs = integrations
    .map(integration => {
      if (integration.tabs) {
        return integration.tabs({ integrationData }).map(tab => ({
          ...tab,
          active: activeTab === tab.id,
          onSelect: () => {
            setActiveTab(tab.id);
          },
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
                element={<TabContent integrationData={integrationData} key={tab.id} />}
              ></Route>
            );
          })}
        </Routes>
      </MemoryRouter>
    </>
  );
}
