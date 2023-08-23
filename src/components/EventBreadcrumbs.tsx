import { SentryEvent } from "../types";
import Time from "./Time";

const EXAMPLE_BREADCRUMB = `Sentry.addBreadcrumb({
  category: "auth",
  message: "Authenticated user " + user.email,
  level: "info",
});`;

export default function EventBreadcrumbs({ event }: { event: SentryEvent }) {
  if (!event.breadcrumbs || !event.breadcrumbs.values.length) {
    return (
      <div className="px-6 space-y-4">
        <div className="text-indigo-300">
          No breadcrumbs available for this event. Try adding some to make
          debugging easier.
        </div>
        <pre className="whitespace-pre-wrap ">{EXAMPLE_BREADCRUMB}</pre>
      </div>
    );
  }
  return (
    <div className="space-y-2 divide-y divide-indigo-800">
      {event.breadcrumbs.values.map((crumb, crumbIdx) => {
        return (
          <div key={crumbIdx} className="flex items-center  p-2">
            <div className="w-32 text-indigo-300">
              <Time date={crumb.timestamp} />
            </div>
            <div className="flex-1 font-mono">{crumb.message}</div>
          </div>
        );
      })}
    </div>
  );
}
