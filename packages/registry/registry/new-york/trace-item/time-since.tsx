"use client";

import type { TimeSinceProps } from "@/registry/new-york/trace-item/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

/**
 * TimeSince component displays a relative time string that automatically
 * updates at a configurable interval.
 */
export function TimeSince({ date, refreshInterval = 5000, ...props }: TimeSinceProps) {
  const [value, setValue] = useState<string | null>(() => (date ? dayjs(date).fromNow() : null));

  useEffect(() => {
    if (!date) {
      setValue(null);
      return;
    }

    // Set initial value
    setValue(dayjs(date).fromNow());

    // Set up interval to refresh the relative time
    const timer = setInterval(() => {
      setValue(dayjs(date).fromNow());
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [date, refreshInterval]);

  if (!date || !value) return null;

  const dateTimeString = date instanceof Date ? date.toISOString() : String(date);

  return (
    <time dateTime={dateTimeString} {...props}>
      {value}
    </time>
  );
}

export default TimeSince;
