import { NavLink, useNavigate } from 'react-router-dom';
import { type IntegrationTab } from '~/integrations/integration';
import classNames from '../lib/classNames';

export type Props = {
  /**
   * Array of tabs to display.
   */
  tabs: IntegrationTab<unknown>[];

  /**
   * Whether the tabs are nested inside another tab.
   * If `nested` is `true`, links will be set relative to the parent
   * tab route instead of absolute to the root.
   */
  nested?: boolean;
};

export default function Tabs({ tabs, nested }: Props) {
  const navigate = useNavigate();
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
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          onChange={e => {
            const activeTab = tabs.find(tab => tab.id === e.target.value);
            if (activeTab && activeTab.onSelect) {
              activeTab.onSelect();
            }
            navigate(`${nested ? '' : '/'}${activeTab?.id || 'not-found'}`);
          }}
        >
          {tabs.map((tab, tabIdx) => (
            <option key={tabIdx} value={tab.id}>
              {tab.title} {tab.notificationCount}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav className="flex space-x-8 border-b border-b-indigo-700 px-6" aria-label="Tabs">
          {tabs.map(tab => (
            <NavLink
              to={`${nested ? '' : '/'}${tab.id}`}
              key={tab.id}
              className={({ isActive }) =>
                classNames(
                  isActive
                    ? 'border-indigo-200 text-indigo-100'
                    : 'border-transparent text-indigo-400 hover:border-indigo-400 hover:text-indigo-100',
                  '-m-y -mx-2 flex whitespace-nowrap border-b-2 px-2 py-3 text-sm font-medium',
                )
              }
              onClick={() => tab.onSelect && tab.onSelect()}
              aria-current={tab.active ? 'page' : undefined}
            >
              {tab.title}
              {tab.notificationCount !== undefined ? (
                <span
                  className={classNames(
                    tab.active ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-700 text-indigo-200',
                    'ml-3 hidden rounded px-2.5 py-0.5 text-xs font-medium md:inline-block',
                  )}
                >
                  {tab.notificationCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
