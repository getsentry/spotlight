import { createElement, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import type { Integration, IntegrationData } from "~/integrations/integration";
import type { NotificationCount } from "~/types";
import Navigation from "./navigation";

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

  const panels = integrations.flatMap(integration => {
    if (integration.panels || integration.tabs) {
      const processedEvents = integrationData[integration.name]?.map(container => container.event) || [];
      return (
        integration.panels?.({ processedEvents }) ||
        integration.tabs?.({ processedEvents }).map(tab => ({
          ...tab,
          processedEvents: processedEvents,
        })) ||
        []
      );
    }
    return [];
  });

  const newNotificationSum = panels.reduce(
    (sum, panel) => ({
      count: sum.count + (panel.notificationCount?.count || 0),
      severe: sum.severe || panel.notificationCount?.severe || false,
    }),
    { count: 0, severe: false },
  );

  if (newNotificationSum.count !== notificationCountSum.count) {
    setNotificationCountSum(newNotificationSum);
  }

  useEffect(() => {
    setTriggerButtonCount(notificationCountSum);
  }, [notificationCountSum, setTriggerButtonCount]);

  return (
    <div className="flex flex-1">
      <Navigation panels={panels} setOpen={setOpen} />
      <div className="flex-1">
        <Routes>
          <Route path="/not-found" element={<p>Not Found - How'd you manage to get here?</p>} key={"not-found"} />
          {panels.map(({ content: PanelContent, id }) =>
            PanelContent ? <Route path={`/${id}/*`} key={id} element={createElement(PanelContent)} /> : null,
          )}
        </Routes>
      </div>
    </div>
  );
}
