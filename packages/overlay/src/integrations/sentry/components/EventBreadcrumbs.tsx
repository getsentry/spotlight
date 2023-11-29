import { Breadcrumb, SentryEvent } from '../types';
import Time from './Time';

const EXAMPLE_BREADCRUMB = `Sentry.addBreadcrumb({
  category: "auth",
  message: "Authenticated user " + user.email,
  level: "info",
});`;

function extractBreadcrumbs(event: SentryEvent): Breadcrumb[] | undefined {
  if (!event.breadcrumbs) return [];

  if (Array.isArray(event.breadcrumbs)) {
    return event.breadcrumbs;
  }

  if (Array.isArray(event.breadcrumbs.values)) {
    return event.breadcrumbs.values;
  }
}

export default function EventBreadcrumbs({ event }: { event: SentryEvent }) {
  const breadcrumbs = extractBreadcrumbs(event);
  if (!breadcrumbs) {
    return (
      <div className="space-y-4 px-6">
        <div className="text-primary-300">
          No breadcrumbs available for this event. Try adding some to make debugging easier.
        </div>
        <pre className="whitespace-pre-wrap ">{EXAMPLE_BREADCRUMB}</pre>
      </div>
    );
  }
  return (
    <div className="divide-primary-800 -mx-2 space-y-2 divide-y">
      {breadcrumbs.map((crumb, crumbIdx) => {
        if (!crumb.message) return null;
        return (
          <div key={crumbIdx} className="flex gap-4 p-2">
            <div className="flex flex-none flex-col">
              <div className="text-primary-300">
                <Time date={crumb.timestamp} format="HH:mm:ss" />
              </div>
              <div className="text-primary-300">{crumb.category || ' '}</div>
            </div>
            <pre className="grow whitespace-pre-line font-mono">{crumb.message}</pre>
          </div>
        );
      })}
    </div>
  );
}
