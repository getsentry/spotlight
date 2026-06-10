import type { TabPanel } from "@spotlight/ui/types";
import { NavLink } from "react-router-dom";

type TabsProps = {
  tabs: TabPanel<unknown>[];
  /**
   * Absolute base path the tabs live under (e.g. `/telemetry/traces/<id>`).
   * Required for tabs rendered inside splat routes: React Router v7 resolves
   * relative links against the full current location (including splat
   * segments), which would otherwise stack the path on repeated navigation.
   */
  basePath?: string;
  nested?: boolean;
};

export default function TelemetryTabs({ tabs, basePath, nested = false }: TabsProps) {
  return (
    <nav className="flex border-b border-primary-700">
      {tabs.map(tab => {
        const tabPath = basePath ? `${basePath}/${tab.id}` : nested ? `./${tab.id}` : `/${tab.id}`;

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
