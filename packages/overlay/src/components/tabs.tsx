import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { IntegrationPanel } from "~/integrations/integration";
import classNames from "../lib/classNames";
import useKeyPress from "../lib/useKeyPress";

export type Props = {
  /**
   * Array of panels to display.
   */
  tabs: IntegrationPanel<unknown>[];
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

export default function Tabs({ tabs, nested, setOpen }: Props) {
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
            const activeTab = tabs.find(tab => tab.id === e.target.value);
            if (activeTab?.onSelect) {
              activeTab.onSelect();
            }
            navigate(`${nested ? "" : "/"}${activeTab?.id || "not-found"}`);
          }}
        >
          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.title} {tab.notificationCount?.count}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav className="border-b-primary-700 flex space-x-8 border-b px-6" aria-label="Tabs">
          {tabs.map(tab => (
            <NavLink
              to={`${nested ? "" : "/"}${tab.id}`}
              key={tab.id}
              replace={true}
              className={({ isActive }) =>
                classNames(
                  isActive
                    ? "border-primary-200 text-primary-100 [&>.count]:bg-primary-100 [&>.count]:text-primary-600"
                    : "text-primary-400 hover:border-primary-400 hover:text-primary-100 [&>.count]:bg-primary-700 [&>.count]:text-primary-200 border-transparent",
                  "-m-y -mx-2 flex select-none whitespace-nowrap border-b-2 px-2 py-3 text-sm font-medium",
                )
              }
              onClick={() => tab.onSelect?.()}
            >
              {tab.title}
              {tab.notificationCount !== undefined ? (
                <span className="count ml-3 hidden rounded px-2.5 py-0.5 text-xs font-medium md:inline-block">
                  {tab.notificationCount?.count}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
