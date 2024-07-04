import { Fragment } from 'react';
import classNames from '~/lib/classNames';
import Time from '../../../../components/Time';
import { Breadcrumb, SentryEvent } from '../../types';

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
  if (!breadcrumbs || !breadcrumbs.length || breadcrumbs.every(crumb => !crumb.message)) {
    return (
      <div className="space-y-4">
        <div className="text-primary-300">
          No breadcrumbs available for this event. Try adding some to make debugging easier.
        </div>
        <pre className="whitespace-pre-wrap ">{EXAMPLE_BREADCRUMB}</pre>
      </div>
    );
  }
  return (
    <div className="divide-primary-800 grid-cols-2-auto -mx-2 grid space-y-2 divide-y">
      {breadcrumbs.map((crumb, crumbIdx) => {
        if (!crumb.message) return null;
        return (
          <Fragment key={crumbIdx}>
            <div className="flex flex-none flex-col p-2">
              <div className="text-lg font-semibold">{crumb.category || ' '}</div>
              <div className="text-primary-300 text-xs">
                <Time date={crumb.timestamp} format="HH:mm:ss" />
              </div>
            </div>
            <pre
              className={classNames(
                'flex grow items-center whitespace-pre-line p-2 !font-mono',
                crumbIdx === 0 ? '!border-t-0' : '',
              )}
            >
              {crumb.message}
            </pre>
          </Fragment>
        );
      })}
    </div>
  );
}
