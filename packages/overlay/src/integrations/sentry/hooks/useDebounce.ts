// Ref: https://stackoverflow.com/a/78529642/16866418
import { useLayoutEffect, useMemo, useRef } from 'react';

// The reason we need to go through all these shenanigans is
// because we cannot just use `useState` and debounce the setter.
// If you do that, we end up having a new debounced function for
// every render, defeating the entire purpose.
export default function useDebounce<T extends (...args: unknown[]) => void>(callback: T, delay: number) {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  let timer: number;

  const debounceFunction = (func: T, delayMs: number, ...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      func(...args);
    }, delayMs);
  };

  return useMemo(
    () =>
      (...args: Parameters<T>) =>
        debounceFunction(callbackRef.current, delay, ...args),
    [delay],
  );
}
