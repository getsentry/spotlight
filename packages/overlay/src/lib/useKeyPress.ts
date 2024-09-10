import { useEffect } from 'react';

type ModifierKeys = 'altKey' | 'ctrlKey' | 'shiftKey' | 'metaKey';

/**
 * useKeyPress
 * @param {string} key - The letter or name of the key to respond to -- this is normalized to lower case
 * @param {ModifierKeys[]} modifiers - The modifiers that needs to be activated such as ctrlKey
 * @param {function} action - the action to perform on key press
 * @param {boolean} propagate - whether to stop event propagation (default is false)
 */
export default function useKeyPress(key: string, modifiers: ModifierKeys[], action: () => void, propagate = false) {
  const normalizedKey = key.toLowerCase();
  useEffect(() => {
    function onKeyup(evt: KeyboardEvent) {
      if (!propagate) {
        evt.stopPropagation();
      }

      // We don't respond to modifier-only key presses
      if (!evt.key) {
        return;
      }

      if (modifiers.every(key => evt[key]) && evt.key.toLowerCase() === normalizedKey) {
        action();
      }
    }

    window.addEventListener('keyup', onKeyup);

    return () => window.removeEventListener('keyup', onKeyup) as undefined;
  }, [normalizedKey, modifiers, action, propagate]);
}
