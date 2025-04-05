import { createElement, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import type { Integration, IntegrationData, IntegrationTab } from '~/integrations/integration';
import type { NotificationCount } from '~/types';
import Tabs from './Tabs';

type ExtendedIntegrationTab<T> = IntegrationTab<T> & {
  processedEvents: T[];
};

export default function Overview({
  integrations,
  integrationData,
  setTriggerButtonCount,
  setOpen,
}: {
  integrations: Integration[];
  integrationData: IntegrationData<unknown>;
  setTriggerButtonCount: (count: NotificationCount) => void;
  setOpen: (value: boolean) => void;
}) {
  const [notificationCountSum, setNotificationCountSum] = useState<NotificationCount>({ count: 0, severe: false });
  const [tabs, setTabs] = useState<ExtendedIntegrationTab<unknown>[]>([]);

  useEffect(() => {
    const initializeTabs = async () => {
      await Promise.all(integrations.map(integration => integration.waitForUpdates?.()));

      const calculatedTabs = integrations.flatMap(integration => {
        if (integration.tabs) {
          const processedEvents = integrationData[integration.name]?.map(container => container.event) || [];
          return integration.tabs({ processedEvents }).map(tab => ({
            ...tab,
            processedEvents: processedEvents,
          }));
        }
        return [];
      });

      setTabs(calculatedTabs);
    };

    initializeTabs();
  }, [integrations, integrationData]);

  useEffect(() => {
    const newNotificationSum = tabs.reduce(
      (sum, tab) => ({
        count: sum.count + (tab.notificationCount?.count || 0),
        severe: sum.severe || tab.notificationCount?.severe || false,
      }),
      { count: 0, severe: false },
    );

    if (newNotificationSum.count !== notificationCountSum.count) {
      setNotificationCountSum(newNotificationSum);
    }
  }, [tabs, notificationCountSum]);

  useEffect(() => {
    setTriggerButtonCount(notificationCountSum);
  }, [notificationCountSum, setTriggerButtonCount]);

  return (
    <>
      <Tabs tabs={tabs} setOpen={setOpen} />
      <Routes>
        <Route path="/not-found" element={<p>Not Found - How'd you manage to get here?</p>} key={'not-found'} />
        {tabs.map(({ content: TabContent, id, processedEvents }) =>
          TabContent ? (
            <Route path={`/${id}/*`} key={id} element={createElement(TabContent, { processedEvents })} />
          ) : null,
        )}
      </Routes>
    </>
  );
}
