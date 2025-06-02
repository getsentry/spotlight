import { Fragment } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { IntegrationLink } from "~/integrations/integration";
import classNames from "../lib/classNames";
import useKeyPress from "../lib/useKeyPress";

export type Props = {
  /**
   * Array of tabs to display.
   */
  links: IntegrationLink<unknown>[];
} & (NestedTabsProps | TopLevelTabsProps);

type NestedTabsProps = {
  /**
   * Whether the tabs are nested inside another tab.
   * If `nested` is `true`, links will be set relative to the parent
   * tab route instead of absolute to the root.
   */
  nested: true;

  setOpen?: undefined;
};

type TopLevelTabsProps = {
  nested?: false;

  /**
   * Setter to control the open state of the overlay
   */
  setOpen: (value: boolean) => void;
};

export default function Navigation({ links, nested, setOpen }: Props) {
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
            const activeLink = links.find(link => link.id === e.target.value);
            if (activeLink?.onSelect) {
              activeLink.onSelect();
            }
            navigate(`${nested ? "" : "/"}${activeLink?.id || "not-found"}`);
          }}
        >
          {links.map(link => (
            <option key={link.id} value={link.id}>
              {link.title} {link.notificationCount?.count}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block flex-1 h-full min-w-[200px] py-2">
        <nav className="border-r-primary-700 border-r px-6 h-full flex flex-col" aria-label="Navigation">
          {links.map(link => (
            <Fragment key={link.id}>
              <NavLink
                to={`${nested ? "" : "/"}${link.id}`}
                key={link.id}
                replace={true}
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? "text-primary-100 [&>.count]:bg-primary-100 [&>.count]:text-primary-600"
                      : "text-primary-400 hover:text-primary-100 [&>.count]:bg-primary-700 [&>.count]:text-primary-200",
                    "-m-y -mx-2 select-none whitespace-nowrap px-2 py-3 text-sm font-medium",
                  )
                }
                onClick={() => link.onSelect?.()}
              >
                {link.title}
                {link.notificationCount !== undefined ? (
                  <span className="count ml-3 hidden rounded px-2.5 py-0.5 text-xs font-medium md:inline-block">
                    {link.notificationCount?.count}
                  </span>
                ) : null}
              </NavLink>
              {link.links && (
                <div className="flex flex-col pl-4">
                  {link.links({ processedEvents: [] }).map(childLink => (
                    <NavLink
                      to={`${link.id}/${childLink.id}`}
                      key={childLink.id}
                      replace={true}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? "text-primary-100 [&>.count]:bg-primary-100 [&>.count]:text-primary-600"
                            : "text-primary-400 hover:text-primary-100 [&>.count]:bg-primary-700 [&>.count]:text-primary-200",
                          "-m-y -mx-2 select-none whitespace-nowrap px-2 py-1 text-sm font-medium",
                        )
                      }
                      onClick={() => link.onSelect?.()}
                    >
                      {childLink.title}
                      {childLink.notificationCount !== undefined ? (
                        <span className="count ml-3 hidden rounded px-2.5 py-0.5 text-xs font-medium md:inline-block">
                          {childLink.notificationCount?.count}
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
