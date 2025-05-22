'use client';
import { AlertCircle, Clock, Filter, GitBranch, Hash, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '~/ui/badge';
import { Button } from '~/ui/button';
import { Input } from '~/ui/input';
import { getSpotlightContainer } from '~/utils/dom';
import { FilterDropdown } from '../shared/FilterDropdown';

const FILTER_CONFIGS = {
  transaction: {
    icon: Filter,
    label: 'Transaction',
    tooltip: 'Filter by transaction type',
    options: [
      { label: 'Missing Root Transaction', value: 'missing root transaction' },
      { label: 'Alerts/Rules', value: '/alerts/rules/' },
      { label: 'Provider/Owner/Repo', value: '/:provider/:owner/:repo' },
    ],
  },
  method: {
    icon: Hash,
    label: 'Method',
    tooltip: 'Filter by HTTP method',
    options: [
      { label: 'GET Requests', value: 'GET' },
      { label: 'POST Requests', value: 'POST' },
    ],
  },
  status: {
    icon: AlertCircle,
    label: 'Status',
    tooltip: 'Filter by status',
    options: [
      { label: 'OK', value: 'ok' },
      { label: 'Error', value: 'error' },
    ],
  },
  time: {
    icon: Clock,
    label: 'Time',
    tooltip: 'Filter by time period',
    options: [
      { label: 'Last 3 months', value: '3 months' },
      { label: 'Last 6 months', value: '6 months' },
      { label: 'Last year', value: 'year' },
    ],
  },
  performance: {
    icon: GitBranch,
    label: 'Performance',
    tooltip: 'Filter by performance metrics',
    options: [
      { label: 'No spans (0)', value: '0 spans' },
      { label: 'With spans (>0)', value: '>0 spans' },
      { label: 'Fast (<100ms)', value: '<100ms' },
      { label: 'Medium (100ms-1s)', value: '100ms-1s' },
      { label: 'Slow (>1s)', value: '>1s' },
    ],
  },
};

export default function TraceListFilter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const spotlightContainer = getSpotlightContainer();

  const handleFilterChange = (value: string, checked: boolean) => {
    if (checked) {
      setActiveFilters(prev => [...prev, value]);
    } else {
      setActiveFilters(prev => prev.filter(f => f !== value));
    }
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };

  return (
    <div className="border-primary-600 border-b p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(FILTER_CONFIGS).map(([key, config]) => (
            <FilterDropdown
              key={key}
              icon={config.icon}
              label={config.label}
              tooltip={config.tooltip}
              options={config.options}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              container={spotlightContainer}
            />
          ))}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
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
