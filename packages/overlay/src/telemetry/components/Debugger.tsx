import TelemetryView from "./TelemetryView";

export default function Debugger({
  isOnline,
  showClearEventsButton,
  contextId,
}: {
  isOnline: boolean;
  showClearEventsButton: boolean;
  contextId: string;
}) {
  return (
    <div className="spotlight-debugger from-primary-900 to-primary-950 flex h-full flex-col overflow-hidden bg-gradient-to-br from-0% to-20% font-sans text-white">
      <TelemetryView isOnline={isOnline} showClearEventsButton={showClearEventsButton} contextId={contextId} />
    </div>
  );
}
