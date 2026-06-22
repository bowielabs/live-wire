import { useEffect, useState } from "react";

function initial(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** Persisted "keep this panel pinned beside the board" preference, so the
    truth table / problem description stay watchable while you toggle inputs
    (and survive level changes). One instance per `storageKey`. */
export function usePinned(storageKey: string) {
  const [pinned, setPinned] = useState<boolean>(() => initial(storageKey));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, pinned ? "1" : "0");
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [storageKey, pinned]);

  return { pinned, toggle: () => setPinned((p) => !p) };
}
