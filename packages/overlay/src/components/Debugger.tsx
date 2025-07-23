import type { Integration, IntegrationData } from "~/integrations/integration";
import type { NotificationCount } from "~/types";
import classNames from "../lib/classNames";
import Overview from "./Overview";

function FullscreenBlur({
  isOpen,
  setOpen,
  fullPage,
  children,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  fullPage: boolean;
  children: React.ReactNode;
}) {
  if (fullPage) {
    return <>{children}</>;
  }
  return (
    <div
      className={classNames("spotlight-fullscreen-blur", isOpen ? "" : "hidden!")}
      onClick={e => {
        if (e.target === e.currentTarget) {
          setOpen(false);
        }
      }}
    >
      {children}
    </div>
  );
}

export default function Debugger({
  integrations,
  isOpen,
  setOpen,
  integrationData,
  isOnline,
  setTriggerButtonCount: setNotificationCount,
  fullPage,
  showClearEventsButton,
  contextId,
}: {
  integrations: Integration[];
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  integrationData: IntegrationData<unknown>;
  isOnline: boolean;
  setTriggerButtonCount: (count: NotificationCount) => void;
  fullPage: boolean;
  showClearEventsButton: boolean;
  contextId: string;
}) {
  return (
    <FullscreenBlur isOpen={isOpen} setOpen={setOpen} fullPage={fullPage}>
      <div
        className={classNames(
          // Used for targeting. DO NOT REMOVE.
          "spotlight-debugger",
          "from-primary-900 to-primary-950 flex h-full flex-col overflow-hidden rounded-lg bg-linear-to-br to-20% font-sans text-white shadow-xl",
          fullPage ? "relative rounded-none shadow-none" : "",
        )}
        style={{
          margin: fullPage ? "0" : "2.5vh",
        }}
      >
        <Overview
          integrations={integrations}
          integrationData={integrationData}
          setTriggerButtonCount={setNotificationCount}
          setOpen={setOpen}
          isOnline={isOnline}
          showClearEventsButton={showClearEventsButton}
          contextId={contextId}
        />
      </div>
    </FullscreenBlur>
  );
}
