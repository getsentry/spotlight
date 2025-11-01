import { Fragment } from "react";
import { cn } from "~/lib/cn";
import JsonViewer from "~/telemetry/components/shared/JsonViewer";
import Time from "~/telemetry/components/shared/Time";
import type { Breadcrumb, SentryEvent } from "../../types";
import { CodeViewer } from "../insights/envelopes/CodeViewer";

const EXAMPLE_BREADCRUMB = `Sentry.addBreadcrumb({
  category: "auth",
  message: "Authenticated user " + user.email,
  level: "info",
});`;

function extractBreadcrumbs(event: SentryEvent): Breadcrumb[] {
  if (Array.isArray(event.breadcrumbs)) {
    return event.breadcrumbs;
  }

  if (Array.isArray(event.breadcrumbs?.values)) {
    return event.breadcrumbs.values;
  }
  return [];
}

export default function EventBreadcrumbs({ event }: { event: SentryEvent }) {
  const breadcrumbs = extractBreadcrumbs(event).filter(crumb => crumb.message || crumb.data);
  if (!breadcrumbs.length) {
    return (
      <div className="flex-1 space-y-4 px-6 py-4">
        <div className="text-primary-300">
          No breadcrumbs available for this event. Try adding some to make debugging easier.
        </div>
        <CodeViewer code={EXAMPLE_BREADCRUMB} lang="js" />
      </div>
    );
  }
  return (
    <div className="flex-1 px-6 py-4">
      <div className="divide-primary-800 grid-cols-2-auto -mx-2 grid space-y-2 divide-y">
        {breadcrumbs.map((crumb, crumbIdx) => (
          <Fragment key={`${crumb.timestamp}-${crumb.category}-${crumb.type}`}>
            <div className="flex flex-none flex-col p-2">
              <div className="text-lg font-semibold">{crumb.category || " "}</div>
              <div className="text-primary-300 text-xs">
                <Time date={crumb.timestamp} format="HH:mm:ss" />
              </div>
            </div>
            {crumb.data ? (
              <JsonViewer data={crumb.data} />
            ) : (
              <pre
                className={cn(
                  "flex grow items-center whitespace-pre-line p-2 font-mono!",
                  crumbIdx === 0 ? "border-t-0!" : "",
                )}
              >
                {crumb.message}
              </pre>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
