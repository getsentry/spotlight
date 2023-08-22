import classNames from "../lib/classNames";

export type Props = {
  tabs: {
    name: string;
    active?: boolean;
    count?: number;
    onSelect?: () => void;
  }[];
};

export default function Tabs({ tabs }: Props) {
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
          defaultValue={tabs.find((tab) => tab.active)?.name}
          onChange={(e) => {
            e.stopPropagation();
            const activeTab = tabs[parseInt(e.target.value, 10)];
            activeTab.onSelect && activeTab.onSelect();
          }}
        >
          {tabs.map((tab, tabIdx) => (
            <option key={tabIdx}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              className={classNames(
                tab.active
                  ? "border-indigo-200 text-indigo-100"
                  : "border-transparent text-indigo-400 hover:border-indigo-400 hover:text-indigo-100",
                "flex whitespace-nowrap border-b-2 py-3 px-2 -mx-2 text-sm font-medium"
              )}
              onClick={(e) => {
                e.stopPropagation();
                tab.onSelect && tab.onSelect();
              }}
              aria-current={tab.active ? "page" : undefined}
            >
              {tab.name}
              {tab.count !== undefined ? (
                <span
                  className={classNames(
                    tab.active
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-indigo-700 text-indigo-200",
                    "ml-3 hidden rounded py-0.5 px-2.5 text-xs font-medium md:inline-block"
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
