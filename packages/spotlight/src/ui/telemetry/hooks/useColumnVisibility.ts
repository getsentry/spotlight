import { useEffect, useState } from "react";

const STORAGE_KEY = "spotlight-logs-visible-columns";

export default function useColumnVisibility(defaultColumns: string[]) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.error("Failed to load column visibility from localStorage:", error);
    }
    return new Set(defaultColumns);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(visibleColumns)));
    } catch (error) {
      console.error("Failed to save column visibility to localStorage:", error);
    }
  }, [visibleColumns]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const isColumnVisible = (columnId: string) => visibleColumns.has(columnId);

  return {
    visibleColumns,
    toggleColumn,
    isColumnVisible,
  };
}
