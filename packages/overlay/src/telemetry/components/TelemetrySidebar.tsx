import { Link, useLocation } from "react-router-dom";
import { trigger } from "~/lib/eventTarget";
import type { NotificationCount } from "~/types";
import { Badge } from "~/ui/badge";
import { Button } from "~/ui/button";

interface TelemetrySidebarProps {
  errorCount: number;
  traceCount: number;
  isOnline: boolean;
  showClearEventsButton: boolean;
}

function NavigationLink({
  to,
  title,
  notificationCount,
  isActive,
}: {
  to: string;
  title: string;
  notificationCount?: NotificationCount;
  isActive: boolean;
}) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-x-2 p-3 font-medium transition ${
        isActive ? "bg-primary-600 text-primary-100" : "text-primary-300 hover:bg-primary-800 hover:text-primary-100"
      }`}
    >
      {title}
      {notificationCount && notificationCount.count > 0 && (
        <Badge variant={notificationCount.severe ? "destructive" : "default"}>{notificationCount.count}</Badge>
      )}
    </Link>
  );
}

export default function TelemetrySidebar({
  errorCount,
  traceCount,
  isOnline,
  showClearEventsButton,
}: TelemetrySidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const clearEvents = async () => {
    try {
      await trigger("clearEvents");
    } catch (err) {
      console.error("Failed to clear events", err);
    }
  };

  const isActive = (path: string) => {
    if (path === "/traces") {
      return pathname === "/" || pathname.startsWith("/traces");
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="bg-primary-900 flex flex-col" style={{ width: "240px", minWidth: "240px" }}>
      <header className="flex items-center gap-x-2 p-4">
        <h1 className="text-2xl font-bold">Spotlight</h1>
        {!isOnline && (
          <Badge variant="outline" className="text-red-400 border-red-400">
            Offline
          </Badge>
        )}
      </header>

      <nav className="flex-1 overflow-y-auto">
        <NavigationLink
          to="/traces"
          title="Traces"
          notificationCount={{ count: traceCount }}
          isActive={isActive("/traces")}
        />
        <NavigationLink
          to="/errors"
          title="Errors"
          notificationCount={{ count: errorCount, severe: errorCount > 0 }}
          isActive={isActive("/errors")}
        />
        <NavigationLink to="/logs" title="Logs" isActive={isActive("/logs")} />
        <NavigationLink to="/insights" title="Insights" isActive={isActive("/insights")} />
      </nav>

      {showClearEventsButton && (
        <footer className="p-4 border-t border-primary-800">
          <Button onClick={clearEvents} variant="outline" className="w-full">
            Clear Events
          </Button>
        </footer>
      )}
    </div>
  );
}
