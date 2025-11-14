import { ReactComponent as X } from "@spotlight/ui/assets/cross.svg";
import { ReactComponent as Search } from "@spotlight/ui/assets/search.svg";

import { Badge } from "@spotlight/ui/ui/badge";
import { Button } from "@spotlight/ui/ui/button";
import { Input } from "@spotlight/ui/ui/input";
import { useCallback, useMemo } from "react";
import type { FilterConfigs } from "../../hooks/useTraceFiltering";
import { FilterDropdown } from "../shared/FilterDropdown";

interface TraceListFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
  filterConfigs: FilterConfigs;
}

export default function TraceListFilter({
  searchQuery,
  setSearchQuery,
  activeFilters,
  setActiveFilters,
  filterConfigs,
}: TraceListFilterProps) {
  const handleFilterChange = useCallback(
    (value: string, checked: boolean, type: "checkbox" | "radio") => {
      if (type === "checkbox") {
        if (checked) {
          setActiveFilters(prev => [...prev, value]);
        } else {
          setActiveFilters(prev => prev.filter(f => f !== value));
        }
      } else if (type === "radio") {
        if (checked) {
          setActiveFilters([value]);
        } else {
          setActiveFilters([]);
        }
      }
    },
    [setActiveFilters],
  );

  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery("");
  }, [setSearchQuery, setActiveFilters]);

  const visibleFilterConfigs = useMemo(
    () => Object.entries(filterConfigs).filter(([, config]) => config.show),
    [filterConfigs],
  );

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search by ID or transaction type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border-primary-700 bg-primary-950 w-full pl-9 text-white placeholder:text-gray-400"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleFilterConfigs.map(([key, config]) => (
            <FilterDropdown
              key={key}
              icon={config.icon}
              label={config.label}
              options={config.options}
              type={config.type}
              activeFilters={activeFilters}
              onFilterChange={(value, checked) => handleFilterChange(value, checked, config.type)}
            />
          ))}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilters.map(filter => (
            <Badge key={filter} className="text-white">
              {filter}
              <Button
                variant="ghost"
                size="icon"
                className="ml-1 h-4 w-4 text-gray-400 hover:bg-transparent hover:text-white"
                onClick={() => setActiveFilters(prev => prev.filter(f => f !== filter))}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:bg-transparent hover:text-white"
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
