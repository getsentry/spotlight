import type { ElementType } from "react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  icon: ElementType;
  label: string;
  options: FilterOption[];
  show: boolean;
  type: "checkbox" | "radio";
}

export type FilterConfigs = Record<string, FilterConfig>;
