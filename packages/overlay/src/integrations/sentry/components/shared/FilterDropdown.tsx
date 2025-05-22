import { ChevronDown, LucideIcon } from 'lucide-react';
import { Button } from '~/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '~/ui/dropdownMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/ui/tooltip';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  options: FilterOption[];
  activeFilters: string[];
  onFilterChange: (value: string, checked: boolean) => void;
  container: HTMLElement | null;
}

export function FilterDropdown({
  icon: Icon,
  label,
  tooltip,
  options,
  activeFilters,
  onFilterChange,
  container,
}: FilterDropdownProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-primary-700 hover:bg-primary-900 bg-primary-950 h-10 mix-blend-screen hover:text-white"
              >
                <Icon className="mr-1 h-3 w-3" />
                {label}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent container={container} className="border-primary-700 bg-primary-950 text-white ">
              {options.map(filter => (
                <DropdownMenuCheckboxItem
                  key={filter.value}
                  checked={activeFilters.includes(filter.value)}
                  onCheckedChange={checked => onFilterChange(filter.value, checked)}
                >
                  {filter.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
