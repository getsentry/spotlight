import { useEffect } from "react";

/**
 * useKeyPress
 * @param {string} key - the name of the key to respond to, compared against event.key
 * @param {function} action - the action to perform on key press
 */
// https://www.caktusgroup.com/blog/2020/07/01/usekeypress-hook-react/
export default function useKeyPress(
  key: string,
  action: () => void,
  propagate = false
) {
  useEffect(() => {
    function onKeyup(e: KeyboardEvent) {
      if (!propagate) e.stopPropagation();
      if (e.key === key) action();
    }
    window.addEventListener("keyup", onKeyup);
    return () => window.removeEventListener("keyup", onKeyup);
  }, [key, action, propagate]);
}
