import { createElement, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import type { Integration, IntegrationData } from "~/integrations/integration";
import { log } from "~/lib/logger";
import type { NotificationCount } from "~/types";
import { getPanelsFromIntegrations } from "../integrations/utils/extractPanelsFromIntegrations";
import { getRouteStorageKey } from "../overlay/utils/routePersistence";
import Navigation from "./navigation";

export default function Overview({
  integrations,
  integrationData,
  setTriggerButtonCount,
  setOpen,
  isOnline,
  showClearEventsButton,
  contextId,
}: {
  integrations: Integration[];
  integrationData: IntegrationData<unknown>;
  setTriggerButtonCount: (count: NotificationCount) => void;
  setOpen: (value: boolean) => void;
  isOnline: boolean;
  showClearEventsButton: boolean;
  contextId: string;
}) {
  const [notificationCountSum, setNotificationCountSum] = useState<NotificationCount>({ count: 0, severe: false });
  const location = useLocation();

  useEffect(() => {
    try {
      sessionStorage.setItem(getRouteStorageKey(contextId), location.pathname);
    } catch (error) {
      log("Failed to set current route to browser storage", {
        error,
        currentPath: location.pathname,
      });
    }
  }, [location.pathname, contextId]);

  const panels = getPanelsFromIntegrations(integrations, integrationData);

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
    <div className="flex h-full overflow-hidden">
      <Navigation panels={panels} setOpen={setOpen} isOnline={isOnline} showClearEventsButton={showClearEventsButton} />
      <div className="flex-1 overflow-auto">
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
