import { NavLink } from "react-router-dom";
import type { TabPanel } from "~/types";

type TabsProps = {
  tabs: TabPanel<unknown>[];
  nested?: boolean;
};

export default function TelemetryTabs({ tabs, nested = false }: TabsProps) {
  return (
    <nav className="flex border-b border-primary-700">
      {tabs.map(tab => {
        const tabPath = nested ? `./${tab.id}` : `/${tab.id}`;

        return (
          <NavLink
            key={tab.id}
            to={tabPath}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium transition-colors hover:text-primary-200 ${
                isActive ? "border-b-2 border-primary-400 text-primary-200" : "text-primary-400"
              }`
            }
          >
            {tab.title}
          </NavLink>
        );
      })}
    </nav>
  );
}
