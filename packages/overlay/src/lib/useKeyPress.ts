import { useEffect } from 'react';

/**
 * useKeyPress
 * @param {string[]} keys - an array of keys to respond to, compared against event.key
 * @param {function} action - the action to perform on key press
 * @param {boolean} propagate - whether to stop event propagation (default is false)
 */
export default function useKeyPress(keys: string[], action: () => void, propagate = false) {
  useEffect(() => {
    function onKeyup(e: KeyboardEvent) {
      if (!propagate) e.stopPropagation();

      if (
        keys.every((key: string) => {
          if (key in e) return e[key as keyof KeyboardEvent];
          return e.key.toLowerCase() === key.toLowerCase();
        })
      ) {
        action();
      }
    }

    window.addEventListener('keyup', onKeyup);

    return () => window.removeEventListener('keyup', onKeyup);
  }, [keys, action, propagate]);
}
