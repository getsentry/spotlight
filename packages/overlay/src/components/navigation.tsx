import { Fragment } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ReactComponent as DeleteIcon } from "~/assets/deleteIcon.svg";
import { ReactComponent as Logo } from "~/assets/glyph.svg";
import type { IntegrationPanel } from "~/integrations/integration";
import { getSpotlightEventTarget } from "~/lib/eventTarget";
import classNames from "../lib/classNames";
import useKeyPress from "../lib/useKeyPress";

export type Props = {
  /**
   * Array of panels to display.
   */
  panels: IntegrationPanel<unknown>[];

  setOpen: (value: boolean) => void;
  isOnline: boolean;
  showClearEventsButton: boolean;
};

export default function Navigation({ panels, setOpen, isOnline, showClearEventsButton }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  useKeyPress("Escape", [], () => {
    if (setOpen && location.pathname.split("/").length === 2) {
      setOpen(false);
    } else {
      navigate(-1);
    }
  });

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="border-primary-800 bg-primary-800 hover:bg-primary-700 hover:border-primary-700 focus:bg-primary-800 text-primary-100 block w-full rounded-md py-2 pl-3 pr-10 focus:outline-hidden sm:text-sm"
          onChange={e => {
            const activeLink = panels.find(link => link.id === e.target.value);
            if (activeLink?.onSelect) {
              activeLink.onSelect();
            }
            navigate(`/${activeLink?.id || "not-found"}`);
          }}
        >
          {panels.map(link => (
            <option key={link.id} value={link.id}>
              {link.title} {link.notificationCount?.count}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block flex-1 h-full min-w-[200px]">
        <nav className="border-r-primary-700 border-r py-4 px-6 h-full flex flex-col" aria-label="Navigation">
          <div className="text-primary-200 flex items-center gap-x-2 pb-4 border-b-primary-700 mb-2">
            <h1 className="font-raleway flex flex-1 flex-col items-start gap-x-1 leading-7 opacity-80">
              <div className="inline-flex items-center gap-x-2">
                <Logo height={24} width={24} />
                <div className="text-xl font-light uppercase leading-7 tracking-wider">Spotlight</div>
              </div>
              <div className="text-primary-300 flex items-center gap-x-1 text-xs ml-[calc(24px+0.5rem)]">
                <span>by</span>
                <a
                  rel="noreferrer noopener"
                  href="https://sentry.io"
                  target="_blank"
                  className="font-semibold hover:underline"
                >
                  Sentry
                </a>
              </div>
            </h1>
          </div>
          {panels.map(panel => (
            <Fragment key={panel.id}>
              <NavLink
                to={`/${panel.id}`}
                key={panel.id}
                replace={true}
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? "text-primary-100 [&>.count]:bg-primary-100 [&>.count]:text-primary-600"
                      : "text-primary-400 hover:text-primary-100 [&>.count]:bg-primary-700 [&>.count]:text-primary-200",
                    "-m-y -mx-2 select-none whitespace-nowrap px-2 py-3 text-sm font-medium",
                  )
                }
                onClick={() => panel.onSelect?.()}
              >
                {panel.title}
                {panel.notificationCount !== undefined ? (
                  <span className="count ml-3 hidden rounded-sm px-2.5 py-0.5 text-xs font-medium md:inline-block">
                    {panel.notificationCount?.count}
                  </span>
                ) : null}
              </NavLink>
              {panel.panels && (
                <div className="flex flex-col pl-4">
                  {panel.panels({ processedEvents: [] }).map(childPanel => (
                    <NavLink
                      to={`${panel.id}/${childPanel.id}`}
                      key={childPanel.id}
                      replace={true}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? "text-primary-100 [&>.count]:bg-primary-100 [&>.count]:text-primary-600"
                            : "text-primary-400 hover:text-primary-100 [&>.count]:bg-primary-700 [&>.count]:text-primary-200",
                          "-m-y -mx-2 select-none whitespace-nowrap px-2 py-1 text-sm font-medium",
                        )
                      }
                      onClick={() => panel.onSelect?.()}
                    >
                      {childPanel.title}
                      {childPanel.notificationCount !== undefined ? (
                        <span className="count ml-3 hidden rounded-sm px-2.5 py-0.5 text-xs font-medium md:inline-block">
                          {childPanel.notificationCount?.count}
                        </span>
                      ) : null}
                    </NavLink>
                  ))}
                </div>
              )}
            </Fragment>
          ))}
          <div className="mt-auto pt-4 pb-4">
            <div className="flex items-center justify-center gap-x-2 pb-2 mb-2 border-b-primary-700 border-b">
              <a
                href="https://github.com/getsentry/spotlight"
                target="_blank"
                rel="noreferrer noopener"
                className="sl-flex text-primary-300 hover:text-primary-100"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  aria-hidden="true"
                  className="astro-6byselsc"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.08 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3Z" />
                </svg>
              </a>
              <a
                href="https://discord.gg/EJjqM3XtXQ"
                target="_blank"
                rel="noreferrer noopener"
                className="sl-flex text-primary-300 hover:text-primary-100"
              >
                <span className="sr-only">Discord</span>

                <svg
                  aria-hidden="true"
                  className="astro-dte75iyl astro-vikp3yof"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51 13.78 13.78 0 0 0-.64 1.28 18.27 18.27 0 0 0-5.5 0 12.64 12.64 0 0 0-.64-1.28h-.05A19.74 19.74 0 0 0 3.64 4.4 20.26 20.26 0 0 0 .11 18.09l.02.02a19.9 19.9 0 0 0 6.04 3.03l.04-.02a14.24 14.24 0 0 0 1.23-2.03.08.08 0 0 0-.05-.07 13.1 13.1 0 0 1-1.9-.92.08.08 0 0 1 .02-.1 10.2 10.2 0 0 0 .41-.31h.04a14.2 14.2 0 0 0 12.1 0l.04.01a9.63 9.63 0 0 0 .4.32.08.08 0 0 1-.03.1 12.29 12.29 0 0 1-1.9.91.08.08 0 0 0-.02.1 15.97 15.97 0 0 0 1.27 2.01h.04a19.84 19.84 0 0 0 6.03-3.05v-.03a20.12 20.12 0 0 0-3.57-13.69ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.22 0 2.18 1.1 2.16 2.42 0 1.34-.94 2.42-2.16 2.42Z" />
                </svg>
              </a>
            </div>
            {showClearEventsButton && (
              <button
                className="bg-primary-900 text-primary-300 hover:bg-primary-800 mb-2 flex w-full items-center gap-1 rounded-md px-2 py-1 hover:transition-colors"
                type="button"
                onClick={() => {
                  getSpotlightEventTarget().dispatchEvent(
                    new CustomEvent("clearEvents", {
                      detail: {},
                    }),
                  );
                }}
              >
                <DeleteIcon width={16} height={16} className="fill-red-400 stroke-red-400" />
                <span className="text-sm">Clear Events</span>
              </button>
            )}
            <div className={classNames("flex items-center gap-x-2 text-xs", isOnline ? "" : "text-red-400")}>
              <div
                className={classNames(
                  " block h-2 w-2 rounded-full",
                  isOnline ? "bg-green-400" : "animate-pulse bg-red-400",
                )}
              />
              {isOnline ? "Connected to Sidecar" : "Not connected to Sidecar"}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
