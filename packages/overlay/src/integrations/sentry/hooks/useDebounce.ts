// Ref: https://stackoverflow.com/a/78529642/16866418
import { useLayoutEffect, useMemo, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
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
