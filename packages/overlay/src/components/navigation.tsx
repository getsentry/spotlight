import { Fragment } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { IntegrationPanel } from "~/integrations/integration";
import classNames from "../lib/classNames";
import useKeyPress from "../lib/useKeyPress";

export type Props = {
  /**
   * Array of panels to display.
   */
  panels: IntegrationPanel<unknown>[];

  setOpen: (value: boolean) => void;
};

export default function Navigation({ panels, setOpen }: Props) {
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
          className="border-primary-800 bg-primary-800 hover:bg-primary-700 hover:border-primary-700 focus:bg-primary-800 text-primary-100 block w-full rounded-md py-2 pl-3 pr-10 focus:outline-none sm:text-sm"
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
      <div className="hidden sm:block flex-1 h-full min-w-[200px] py-2">
        <nav className="border-r-primary-700 border-r px-6 h-full flex flex-col" aria-label="Navigation">
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
                  <span className="count ml-3 hidden rounded px-2.5 py-0.5 text-xs font-medium md:inline-block">
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
                        <span className="count ml-3 hidden rounded px-2.5 py-0.5 text-xs font-medium md:inline-block">
                          {childPanel.notificationCount?.count}
                        </span>
                      ) : null}
                    </NavLink>
                  ))}
                </div>
              )}
            </Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
}
