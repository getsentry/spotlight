// Ref: https://stackoverflow.com/a/78529642/16866418
import { useLayoutEffect, useMemo, useRef } from 'react';

// The reason we need to go through all these shenanigans is
// because we cannot just use `useState` and debounce the setter.
// If you do that, we end up having a new debounced function for
// every render, defeating the entire purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(
    () =>
      (...args: Parameters<T>) => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          callbackRef.current(...args);
          timerRef.current = null;
        }, delay);
      },
    [delay],
  );
}
