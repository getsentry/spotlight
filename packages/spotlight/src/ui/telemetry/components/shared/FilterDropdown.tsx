import { ReactComponent as ChevronDown } from "@spotlight/ui/assets/chevronDown.svg";
import { Button } from "@spotlight/ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@spotlight/ui/ui/dropdownMenu";
import type { ElementType } from "react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  icon: ElementType;
  label: string;
  options: FilterOption[];
  activeFilters: string[];
  onFilterChange: (value: string, checked: boolean) => void;
  type: "checkbox" | "radio";
}

export function FilterDropdown({
  icon: Icon,
  label,
  options,
  activeFilters,
  onFilterChange,
  type,
}: FilterDropdownProps) {
  return (
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
      <DropdownMenuContent className="border-primary-700 bg-primary-950 max-h-52 text-white">
        {type === "checkbox" &&
          options.map(filter => (
            <DropdownMenuCheckboxItem
              key={filter.value}
              checked={activeFilters.includes(filter.value)}
              onCheckedChange={checked => onFilterChange(filter.value, checked)}
            >
              {filter.label}
            </DropdownMenuCheckboxItem>
          ))}
        {type === "radio" && (
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
  );
}
