import { ElementType } from 'react';
import { ReactComponent as ChevronDown } from '~/assets/chevronDown.svg';
import { Button } from '~/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '~/ui/dropdownMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/ui/tooltip';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  icon: ElementType;
  label: string;
  tooltip: string;
  options: FilterOption[];
  activeFilters: string[];
  onFilterChange: (value: string, checked: boolean) => void;
  container: HTMLElement | null;
  type: 'checkbox' | 'radio';
}

export function FilterDropdown({
  icon: Icon,
  label,
  tooltip,
  options,
  activeFilters,
  onFilterChange,
  container,
  type,
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
            <DropdownMenuContent
              container={container}
              className="border-primary-700 bg-primary-950 max-h-52 text-white"
            >
              {type === 'checkbox' &&
                options.map(filter => (
                  <DropdownMenuCheckboxItem
                    key={filter.value}
                    checked={activeFilters.includes(filter.value)}
                    onCheckedChange={checked => onFilterChange(filter.value, checked)}
                  >
                    {filter.label}
                  </DropdownMenuCheckboxItem>
                ))}
              {type === 'radio' && (
                <DropdownMenuRadioGroup value={activeFilters[0]} onValueChange={value => onFilterChange(value, true)}>
                  {options.map(filter => (
                    <DropdownMenuRadioItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              )}
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
