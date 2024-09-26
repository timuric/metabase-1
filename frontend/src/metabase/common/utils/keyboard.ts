import { useCallback } from "react";

/** Returns true if e.key is the given key and no modifier keys (ctrl, meta, alt, shift) were pressed */
export const isPlainKey = (e: React.KeyboardEvent, key: string) => {
  return e.key === key && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
};

/** Returns a function that calls the given callback when the Enter key is pressed */
export const useCallOnEnter = <Elem extends Element>(
  callback: (e: React.KeyboardEvent) => void,
) =>
  useCallback(
    (e: React.KeyboardEvent<Elem>) => {
      if (isPlainKey(e, "Enter")) {
        callback(e);
      }
    },
    [callback],
  );
