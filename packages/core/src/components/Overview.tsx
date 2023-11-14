import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
